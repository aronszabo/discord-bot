module.exports = {
	name: 'stop',
	description: 'Állíts le mindent!',
	execute(message) {
		message.client.user.setPresence({
			status: 'idle',
			activity: {
				name: ''
			}
		});
		const serverQueue = message.client.queue.get(message.guild.id);
		if (!message.member.voice.channel) return message.channel.send('Voiceban kell lenned a muzsika leállításához!');
		if (serverQueue) {
			serverQueue.songs = [];
			serverQueue.connection.dispatcher.end();
			if (serverQueue.radio) {
				serverQueue.voiceChannel.leave();
				serverQueue.gqrxUdpServer.close();
				serverQueue.gqrxUdpServer = null;
				message.client.queue.delete(message.guild.id);
			}
			message.reply(' éppen elpusztítottad a bulit, jókedvet és minden szépet-jót a világon. KafuBot javaslata nyilvános lincselés.');
		} else
			message.channel.send('Mit akarsz leállítani?');
	},
};