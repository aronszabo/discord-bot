module.exports = {
	name: 'channels',
	description: 'Jóféle rádiócsatornák listája',
	async execute(message) {
		let msg = await message.channel.send('Itten vannak : \u{1f356}: 150.75 Rántotthús, \u{1f68B}: 468.63 BKK Villamosok, \u0031\ufe0f\u20e3: 90.9 Jazzy, \u0032\ufe0f\u20e3: 94.2 Trend FM, \u0033\ufe0f\u20e3: 103.3 Retro, \u0034\ufe0f\u20e3: 90.3 Tilos');
		msg.react('\u{1f356}');
		msg.react('\u{1f68B}');
		msg.react('\u0031\ufe0f\u20e3');
		msg.react('\u0032\ufe0f\u20e3');
		msg.react('\u0033\ufe0f\u20e3');
		msg.react('\u0034\ufe0f\u20e3');
		const collector = msg.createReactionCollector((r, u) => u.id != msg.author.id, { time: 30000, dispose: true });
		collector.on('collect', async react => {
			if(react.emoji.name == '\u{1f356}') 
			{
				message.content = 'kfu fm 150.75';
				message.client.commands.get('kfu').execute(message);
			}
			if(react.emoji.name == '\u{1f68B}') 
			{
				message.content = 'kfu fm 468.63';
				message.client.commands.get('kfu').execute(message);
			}
			if(react.emoji.name == '\u0031\ufe0f\u20e3') 
			{
				message.content = 'kfu wfm 90.9';
				await this.play(message, './sounds/gtb_ch1.wav');
			}
			if(react.emoji.name == '\u0032\ufe0f\u20e3') 
			{
				message.content = 'kfu wfm 94.2';
				await this.play(message, './sounds/gtb_ch2.wav');
			}
			if(react.emoji.name == '\u0033\ufe0f\u20e3') 
			{
				message.content = 'kfu wfm_st 103.3';
				await this.play(message, './sounds/gtb_ch3.wav');
			}
			if(react.emoji.name == '\u0034\ufe0f\u20e3') 
			{
				message.content = 'kfu wfm 90.3';
				await this.play(message, './sounds/gtb_ch4.wav');
			}
			//msg.reactions.removeAll();
			//msg.delete();
			//message.delete();
		});
		collector.on('end', collected => {
			msg.reactions.removeAll();
			//msg.delete();
			//message.delete();
		});
	},

    async play(message, file) {
        let serverQueue = message.client.queue.get(message.guild.id);
		if (!serverQueue || (serverQueue.radio == true && serverQueue.gqrxUdpServer == null)) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: message.member.voice.channel,
					radio: false,
					rds: false,
                    connection: null,
                    songs: [],
                    volume: 5,
                    playing: true,
					nowplaying: ''
                };
				message.client.queue.set(message.guild.id, queueContruct);
				var connection = await message.member.voice.channel.join();
				queueContruct.connection = connection;
		}
		serverQueue = message.client.queue.get(message.guild.id);
        const dispatcher = serverQueue.connection.play(file, {
                type: 'unknown',
                bitrate: 160
            })
			.on('finish', () => message.client.commands.get('kfu').execute(message))
            .on("error", error => console.error(error));
		dispatcher.setVolumeLogarithmic(2);
    }
};
