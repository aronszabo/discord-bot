const fs = require('fs')
const Discord = require('discord.js');
const Client = require('./client/Client');
const {
	prefix,
	token,
} = require('./config.json');

var gqrx = require('./util/gqrx');


const client = new Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

console.log(client.commands);

client.once('ready', () => {
	console.log('Ready!');
	setInterval(async () => {
		if(client.queue.values().next().value) {
			if(client.queue.values().next().value.radio && client.queue.values().next().value.rds) {
					let station = await gqrx.callGQRX("RDS_STATION");
					if(!station.includes('.')) client.user.setPresence({ status: 'online', activity: { name: station, type: 'LISTENING' } });
					else client.user.setPresence({ status: 'online', activity: { name: client.queue.values().next().value.nowplaying, type: 'LISTENING' } });
			} else if(client.queue.values().next().value.radio || client.queue.values().next().value.nowplaying)
				client.user.setPresence({ status: 'online', activity: {name: client.queue.values().next().value.nowplaying, type: 'LISTENING'} });
			else client.user.setPresence({ status: 'online', activity: {name: 'YouTube', type: 'LISTENING'} });
		} else client.user.setPresence({ status: 'idle', activity: {name: 'Pihen'} });
	}, 2000);
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', async message => {
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName);

	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;

	try {
		if (commandName == "ban" || commandName == "userinfo") {
			command.execute(message, client);
		} else {
			command.execute(message);
		}
	} catch (error) {
		console.error(error);
		message.reply(`Ezt nem teheted! :[`);
	}
});


client.login(token);