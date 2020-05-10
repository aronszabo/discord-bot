module.exports = {
	name: 'skip',
	description: 'Szkippentsd!',
	execute(message) {
		const serverQueue = message.client.queue.get(message.guild.id);
		if (!message.member.voice.channel) return message.channel.send("Ehhez voiceban kell lenned!");
		if (!serverQueue) return message.channel.send('Nincs semmi, amit szkippententhetnék!');
         
        if (serverQueue.radio) return message.channel.send(`Nice try! :[`);
		serverQueue.connection.dispatcher.end();
	},
};
