const { Util } = require("discord.js");
const ytdl = require("ytdl-core");
const ytsr = require('ytsr');
function validURL2(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
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
      if(validURL2(args[1])){
          console.log("url "+args[1]);
        songInfo = await ytdl.getInfo(args[1]);
      }else{
          
          console.log("search "+args.slice(1).join(" "));
        const searchResults = await ytsr(args.slice(1).join(" "), options);
        if(!validURL2(searchResults.items[0].link)){
            return message.channel.send(
          "Ryp!"
            );
            console.log("bad url "+searchResults.items[0].link);
        }else{
            console.log("url "+searchResults.items[0].link);
        }
        songInfo = await ytdl.getInfo(searchResults.items[0].link);//await ytdl.getInfo(args[1]);
        
            
      }
      const song = {
        title: songInfo.title,
        url: songInfo.video_url
      };

      if (!serverQueue || (serverQueue.radio==true && serverQueue.gqrxUdpServer==null)) {
        const queueContruct = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
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
          this.play(message, queueContruct.songs[0]);
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
      } else {
            if(serverQueue.radio){
                return message.channel.send(

                
          `${song.title}? Bocsi, már megy a rádió!`
        );
            }else{
            serverQueue.songs.push(song);
        return message.channel.send(

                
          `${song.title}-t köszönjük szépen, queueolódtatott!`
        );
            }
        
      }
    } catch (error) {
      console.log(error);
      message.channel.send(error.message);
    }
  },

  play(message, song) {
    const queue = message.client.queue;
    const guild = message.guild;
    const serverQueue = queue.get(message.guild.id);
    if(serverQueue.radio){
        serverQueue.textChannel.send(`Már szól a rádió!`);
        return;
    }
    if (!song && !serverQueue.radio) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
    
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        this.play(message, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Már megy is a: **${song.title}**`);
  }
};
