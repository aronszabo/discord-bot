module.exports = {
	name: 'stop',
	description: 'Állíts le mindent!',
	execute(message) {
		const serverQueue = message.client.queue.get(message.guild.id);
		if (!message.member.voice.channel) return message.channel.send('Voiceban kell lenned a muzsika leállításához!');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end();
        if(serverQueue.radio){
            serverQueue.gqrxUdpServer.close();
            serverQueue.gqrxUdpServer=null;
        }
	},
};
