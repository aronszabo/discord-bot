module.exports = {
	name: 'channels',
	description: 'Jóféle rádiócsatornák listája',
	async execute(message) {
		let msg = await message.channel.send('Itten vannak : 1: 90.9 Jazzy, 2: 94.2 Trend FM, 3: 103.3 Retro, 4: 90.3 Tilos');
		msg.react('\u0031\ufe0f\u20e3');
		msg.react('\u0032\ufe0f\u20e3');
		msg.react('\u0033\ufe0f\u20e3');
		msg.react('\u0034\ufe0f\u20e3');
		const collector = msg.createReactionCollector((r, u) => u.id != msg.author.id, { time: 30000, dispose: true });
		collector.on('collect', react => {
			if(react.emoji.name == '\u0031\ufe0f\u20e3') message.content = 'kfu wfm 90.9';
			if(react.emoji.name == '\u0032\ufe0f\u20e3') message.content = 'kfu wfm 94.2';
			if(react.emoji.name == '\u0033\ufe0f\u20e3') message.content = 'kfu wfm_st 103.3';
			if(react.emoji.name == '\u0034\ufe0f\u20e3') message.content = 'kfu wfm 90.3';
			message.client.commands.get('kfu').execute(message);
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
};
