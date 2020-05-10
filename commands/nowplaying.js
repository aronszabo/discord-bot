module.exports = {
	name: 'nowplaying',
	description: 'Mi megy éppen.',
	execute(message) {
		const serverQueue = message.client.queue.get(message.guild.id);
		if (!serverQueue) return message.channel.send('Nem szól semmi.');
        if(serverQueue.radio){
            
            return message.channel.send(`Ez szól: ${serverQueue.nowplaying}`);
        }else{
            
            return message.channel.send(`Ez megy: ${serverQueue.songs[0].title}`);
        }
	},
};
