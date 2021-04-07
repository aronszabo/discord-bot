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

	//AKOSBOT /*
	/*if(message.content.endsWith("?") && message.author.username == 'akos712')
	{
		message.channel.send('Keress rá: https://google.com/search?q=' + encodeURIComponent(message.content));
		return;
	}*/
	//*/

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

// Track tanfolyam invites

// Initialize the invite cache
const invites = {};

// A pretty useful method to create a delay without blocking the whole script.
const wait = require('util').promisify(setTimeout);

client.on('ready', () => {
  // "ready" isn't really ready. We need to wait a spell.
  wait(1000);
  // Load all invites for all guilds and save them to the cache.
  client.guilds.cache.forEach(g => {
	
    g.fetchInvites().then(guildInvites => {
console.log(guildInvites);
      invites[g.id] = guildInvites;
    });
  });
});

client.on('guildMemberAdd', member => {
console.log("new mwnwber");
  // To compare, we need to load the current invite list.
  member.guild.fetchInvites().then(guildInvites => {
    // This is the *existing* invites for the guild.
    const ei = invites[member.guild.id];
    // Update the cached invites for the guild.
    invites[member.guild.id] = guildInvites;
console.log(ei);
    // Look through the invites, find the one for which the uses went up.
    const invite = guildInvites.find(i => ei.get(i.code).uses < i.uses);
    // This is just to simplify the message being sent below (inviter doesn't have a tag property)
    const inviter = client.users.cache.get(invite.inviter.id);
    // Get the log channel (change to your liking)
    //const logChannel = member.guild.channels.find(channel => channel.name === "join-logs");
    // A real basic message with the information we need. 
	console.log(`${member.user.tag} joined using invite code ${invite.code} from ${inviter.tag}. Invite was used ${invite.uses} times since its creation.`);
		    if (invite.code === "DwHUm5Y") {
console.log(`Tanfolyam 2020 walcome.`);
		        return member.roles.add(member.guild.roles.cache.find(role => role.name === "tanfolyam2020osz"));


		    }
  });
});


// end track tanfolyam invites
client.login(token);
