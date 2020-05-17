const {Util} = require("discord.js");
const ytdl = require("ytdl-core");
const ytsr = require('ytsr');

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function validURL2(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}
module.exports = {
    name: "play",
    description: "Csapass egy számot youtuberól!",
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

            var options = {
                limit: 1
            }
            var songInfo;
            if (validURL2(args[1])) {
                console.log("url " + args[1]);
				try {
                	songInfo = await ytdl.getInfo(args[1]);
				} catch (e) { console.log(e); };
            } else {

                console.log("search " + args.slice(1).join(" "));
                const searchResults = await ytsr(args.slice(1).join(" "), options);
                if (!validURL2(searchResults.items[0].link)) {
                    return message.channel.send(
                        "Ryp!"
                    );
                    console.log("bad url " + searchResults.items[0].link);
                } else {
                    console.log("url " + searchResults.items[0].link);
                }
                songInfo = await ytdl.getInfo(searchResults.items[0].link); //await ytdl.getInfo(args[1]);
            }
            const song = {
                title: songInfo.title,
                url: songInfo.video_url
            };

            if (!serverQueue || (serverQueue.radio == true && serverQueue.gqrxUdpServer == null)) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: voiceChannel,
					radio: false,
					rds: false,
                    connection: null,
                    songs: [],
                    volume: 5,
                    playing: true
                };

                queue.set(message.guild.id, queueContruct);
                queueContruct.songs.push(song);

                try {
                    var connection = await voiceChannel.join();
                    queueContruct.connection = connection;
                    return this.play(message, queueContruct.songs.shift());
                } catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(err);
                }
            } else {
                if (serverQueue.radio) {
                    let msg = await message.channel.send(`**${song.title}**? Bocsi, már megy a rádió!`);

					await (await msg.react('\u23f9')).message.awaitReactions((reaction, user) => reaction.emoji.name === '\u23f9', { max: 2 });
                    message.client.commands.get('stop').execute(message);
					msg.reactions.removeAll();

					await (await msg.react('\u25b6')).message.awaitReactions((reaction, user) => reaction.emoji.name === '\u25b6', { max: 2 });
				    message.client.commands.get('play').execute(message);
					msg.reactions.removeAll();
                } else {
                    serverQueue.songs.push(song);
                    let msg = await message.channel.send(`**${song.title}**-t köszönjük szépen, queueolódtatott!`);
					
					msg.react('\u23f9'); //stop
					msg.react('\u23ed'); //skip
					msg.react('\u25b6'); //play
					const collector = msg.createReactionCollector((r, u) => u.id != msg.author.id, { time: 60000, dispose: true });
					collector.on('collect', react => {
						if(react.emoji.name == '\u23ed') message.client.commands.get('skip').execute(message);
						if(react.emoji.name == '\u23f9') message.client.commands.get('stop').execute(message);
						if(react.emoji.name == '\u25b6') {
							serverQueue.songs.remove(song);
							serverQueue.songs.unshift(song);
							serverQueue.connection.dispatcher.end();
							message.channel.send('Aztakva, de akaratos valaki... Akkor játszom rögtön');
						}
						msg.reactions.removeAll();
					});
					collector.on('end', collected => {
						msg.reactions.removeAll();
					});
                }

            }
        } catch (error) {
            console.log(error);
            message.channel.send(error.message);
        }
    },

    async play(message, song) {
        const queue = message.client.queue;
        const guild = message.guild;
        const serverQueue = queue.get(message.guild.id);
        if (serverQueue.radio) {
            serverQueue.textChannel.send(`Már szól a rádió!`);
            return;
        }
        if (!song && !serverQueue.radio) {
            serverQueue.voiceChannel.leave();
            queue.delete(guild.id);
            return;
        }
		serverQueue.nowplaying = song.title;
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url), {
                type: 'unknown',
                bitrate: 160
            })
            .on("finish", () => {
				let song = serverQueue.songs.shift();
	            this.play(message, song);
            })
            .on("error", error => console.error(error));
		dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
		let msgret = await serverQueue.textChannel.send(`Már megy is a: **${song.title}**`);
		message.client.user.setPresence({
           	status: 'online',
           	activity: {
           	    name: 'YouTube',
           	    type: 'LISTENING'
         	}
		});
		msgret.react('\u23f9'); //stop
		msgret.react('\u23ed'); //skip
		const collector = msgret.createReactionCollector((r, u) => u.id != msgret.author.id, { time: 60000, dispose: true });
		collector.on('collect', react => {
			if(react.emoji.name == '\u23ed') msgret.client.commands.get('skip').execute(message);
			if(react.emoji.name == '\u23f9') msgret.client.commands.get('stop').execute(message);
			msgret.reactions.removeAll();
		});
		collector.on('end', collected => {
			msgret.reactions.removeAll();
		});
		return msgret;
    }
};