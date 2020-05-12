const {
	Util
} = require("discord.js");
var net = require('net');
var udp = require('dgram');
var streamBuffers = require('stream-buffers');
var udpServer = null;

async function callGQRX(msg) {
	return new Promise((resolve, reject) => {
		let client = new net.Socket()
		client.setTimeout(1000);
		client.setEncoding("ascii");

		client.connect(7356, '127.0.0.1', () => {
			client.write(msg + `\r\n`)
		})

		client.on('data', (data) => {
			if(data == "RPRT 1\n") reject("Error received");
			else resolve(data);
			client.destroy()
		})

		client.on('close', () => {})

		client.on('error', reject);

		client.on('timeout', () => {
			console.log("GQRX control socket timeout");
			reject('Timeout');
			client.destroy();
		})

	});
}

function exp10(m) {
	var n = 1;
	for (var i = 0; i < m; i++) n *= 10;
	return n;
}

module.exports = {
	name: "kfu",
	description: "Hangolj a kafuban lévő sdr-re! Syntax: [moduláció] freki",
	async execute(message) {
		try {
			const args = message.content.split(" ");
			const queue = message.client.queue;
			const serverQueue = message.client.queue.get(message.guild.id);

			const voiceChannel = message.member.voice.channel;
			if (!voiceChannel)
				return message.channel.send(
					"Ehhez voiceban kell lenned!"
				);
			const permissions = voiceChannel.permissionsFor(message.client.user);
			if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
				return message.channel.send(
					"Nincs permissionom (lehetetlen)!"
				);
			}

			var modulation = "";
			if (args[1].toUpperCase() == "WFM") {
				modulation = "WFM";
			} else if (args[1].toUpperCase() == "WFM_ST") {
				modulation = "WFM_ST";
			} else if (args[1].toUpperCase() == "FM") {
				modulation = "FM";
			} else if (args[1].toUpperCase() == "AM") {
				modulation = "AM";
			} else if (args[1].toUpperCase() == "LSB") {
				modulation = "LSB";
			} else if (args[1].toUpperCase() == "USB") {
				modulation = "USB";
			} else if (args[1].toUpperCase() == "CW") {
				modulation = "CW";
			}


			var line;
			if (modulation == "") {
				line = args.slice(1).join("");
				modulation = "FM";
			} else {
				line = args.slice(2).join("");
			}

			var fr, fr_dec, fr_dec_len, fr_unit, freq;
			if (match = line.match(/^(\d*)[.,]?(\d*)([MmKk]?)(Hz)?$/)) {
				fr = parseInt(match[1]);
				fr_dec = parseInt(match[2]);
				fr_dec_len = match[2].length;
				fr_unit = match[3];
			} else {
				return message.channel.send(
					"Érvénytelen freki!"
				);
			}

			if (fr_unit == "M" || fr_unit == "m") {
				freq = fr * exp10(6);
				if (!isNaN(fr_dec)) freq += fr_dec * exp10(6 - fr_dec_len);
			} else if (fr_unit == "k") {
				freq = fr * exp10(3);
				if (!isNaN(fr_dec)) freq += fr_dec * exp10(3 - fr_dec_len);
			} else if (fr_dec) {
				freq = fr * exp10(6);
				if (!isNaN(fr_dec)) freq += fr_dec * exp10(6 - fr_dec_len);
			} else {
				freq = fr;
			}
			var fResp = await callGQRX(`F ${freq}`);
			var mResp = await callGQRX(`M ${modulation}`);
			var rdsActive = false;

			if((await callGQRX(`_`)).endsWith("rdsapi\n"))
			{
				if(modulation == "WFM" || modulation == "WFM_ST") {
					var rResp = await callGQRX(`RDS 1`);
					rdsActive = true;
				}
				else
					var rResp = await callGQRX(`RDS 0`);
			}

			message.client.user.setPresence({
				status: 'online',
				activity: {
					name: 'Rádió',
					type: 'LISTENING'
				}
			});

			var queueContruct;
			var connection;
			if (!serverQueue) {
				queueContruct = {
					textChannel: message.channel,
					voiceChannel: voiceChannel,
					connection: null,
					songs: [],
					volume: 1,
					playing: true,
					radio: true,
					rds: rdsActive,
					gqrxUdpServer: udpServer

				};

				queue.set(message.guild.id, queueContruct);
				connection = await voiceChannel.join();
				queueContruct.connection = connection;
			} else {
				if (serverQueue.gqrxUdpServer)
					serverQueue.gqrxUdpServer.close();
				queueContruct = serverQueue;
				connection = queueContruct.connection;
				queueContruct.radio = true;
				queueContruct.rds = rdsActive;
				serverQueue.songs = [];
				if (serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.end();
			}

			try {

				udpServer = udp.createSocket('udp4');
				queueContruct.gqrxUdpServer = udpServer;
				queueContruct.nowplaying = `${modulation} ${freq} Hz!`;
				var fifo = new streamBuffers.ReadableStreamBuffer({
					frequency: 10, // in milliseconds. 10xes meret
					chunkSize: 9600 // in bytes.
				});
				const dispatcher = connection.play(fifo, {
					type: 'converted',
					bitrate: 96
				}).on("error", error => console.error(error));

				dispatcher.setVolumeLogarithmic(queueContruct.volume);

			} catch (err) {
				console.log(err);
				queue.delete(message.guild.id);
				return message.channel.send(err);
			}

			message.channel.send(`Már megy is a(z) ${modulation} **${freq}** Hz!`);
			// emits when any error occurs
			udpServer.on('error', function(error) {
				console.log('Error: ' + error);
				udpServer.close();
			});

			// emits on new datagram msg
			udpServer.on('message', function(msg, info) {
				for (var i = 0; i < msg.length; i += 2) {
					fifo.put(msg.slice(i, i + 2)); // igy csinalunk monobol stereot
					fifo.put(msg.slice(i, i + 2));
				}
			});

			//emits when socket is ready and listening for datagram msgs
			udpServer.on('listening', function() {
				var address = udpServer.address();
				var port = address.port;
				var family = address.family;
				var ipaddr = address.address;
				console.log('Server is listening at port' + port);
				console.log('Server ip :' + ipaddr);
				console.log('Server is IP4/IP6 : ' + family);
			});

			//emits after the socket is closed using socket.close();
			udpServer.on('close', function() {
				console.log('Socket is closed !');
			});

			udpServer.bind(7355);

		} catch (error) {
			console.log(error);
			message.channel.send(error.message);
		}
	},
};