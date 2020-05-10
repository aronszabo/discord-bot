const { Util } = require("discord.js");
var net = require('net');
var udp = require('dgram');
var streamBuffers = require('stream-buffers');
var udpServer=null;
function exp10(m){
 var n=1;
 for(var i=0; i<m; i++) n*=10;
 return n;
}
async function callGQRX(msg) {
    return new Promise((resolve, reject) => {
        let client = new net.Socket()

        client.connect(7356, '127.0.0.1', () => {
            client.write(msg+`\r\n`)
        })

        client.on('data', (data) => {
            resolve(data);
            client.destroy()
        })

        client.on('close', () => {
        })

        client.on('error', reject);

    });
}

module.exports = {
  name: "kfu",
  description: "Hangolj a kafuban lévő sdr-re! Syntax: [moduláció] freki",
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

      var modulation = "";
      if(args[1].toUpperCase()=="WFM"){
        modulation="WFM";    
      }else if(args[1].toUpperCase()=="FM"){
        modulation="FM";    
      }else if(args[1].toUpperCase()=="AM"){
        modulation="AM";    
      }else if(args[1].toUpperCase()=="LSB"){
        modulation="LSB";    
      }else if(args[1].toUpperCase()=="USB"){
        modulation="USB";    
      }else if(args[1].toUpperCase()=="CW"){
        modulation="CW";    
      }
    
      
      var line;
      if(modulation==""){
       line = args.slice(1).join("");
       modulation = "FM";
      }else{
       line = args.slice(2).join("");    
      }
      
      var fr, fr_dec, fr_dec_len, fr_unit, freq;
      if (match = line.match(/^(\d*)[.,]?(\d*)([MmKk]?)(Hz)?$/)) {
        fr = parseInt(match[1]);
        fr_dec = parseInt(match[2]);
        fr_dec_len = match[2].length;
        fr_unit = match[3];
      }else{
       return message.channel.send(
          "Invalid freki!"
        );   
      }
      
      if(fr_unit=="M" || fr_unit=="m"){
        freq = fr*exp10(6);
        if(!isNaN(fr_dec)) freq+= fr_dec*exp10(6-fr_dec_len);
      }else if(fr_unit=="k"){
        freq = fr*exp10(3);
        if(!isNaN(fr_dec)) freq+= fr_dec*exp10(3-fr_dec_len);
      }else if(fr_dec){
        freq = fr*exp10(6);
        if(!isNaN(fr_dec)) freq+= fr_dec*exp10(6-fr_dec_len);
      }else{
        freq = fr;  
      }
      var fResp = await callGQRX(`F ${freq}`);
      var mResp = await callGQRX(`M ${modulation}`);
      
          //var connection = await voiceChannel.join();
          /*const dispatcher = connection
            .play(ytdl(song.url))
            .on("finish", () => {
                //serverQueue.songs.shift();
                //this.play(message, serverQueue.songs[0]);
            })
            .on("error", error => console.error(error));*/
            //dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
            
            
      // creating a udp server
      //const audioStream = new stream2.Readable()
//const audio = connection.receiver.createStream(user, { mode: 'pcm' });
if(serverQueue!=null && serverQueue.gqrxUdpServer!=null) serverQueue.gqrxUdpServer.close();

    var queueContruct;
var connection ;
     if (!serverQueue) {
        queueContruct = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true,
          radio: true,
          gqrxUdpServer: udpServer
          
        };

        queue.set(message.guild.id, queueContruct);
        connection  = await voiceChannel.join();
        queueContruct.connection = connection;
     }else{
         queueContruct = serverQueue;
         connection= queueContruct.connection;
         queueContruct.radio=true;
        serverQueue.songs = [];
        if(serverQueue.connection.dispatcher)serverQueue.connection.dispatcher.end();
        
     }

        try {
          
          udpServer = udp.createSocket('udp4');
          queueContruct.gqrxUdpServer=udpServer;
          queueContruct.nowplaying=`${modulation} ${freq} Hz!`;
            var fifo = new streamBuffers.ReadableStreamBuffer({
                frequency: 10,   // in milliseconds. 10xes meret
                chunkSize: 9600  // in bytes.
            });
            const dispatcher =  connection.play(fifo, { type: 'converted', bitrate: 48 }).on("error", error => console.error(error));
    
            dispatcher.setVolumeLogarithmic(queueContruct.volume / 5);
            
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
     // }
     const sch = message.client.emojis.find(emoji => emoji.name === "sch");
    message.channel.send(`Már megy is az ${modulation} **${freq}** Hz! ${sch}`);
// emits when any error occurs
udpServer.on('error',function(error){
  console.log('Error: ' + error);
  udpServer.close();
});

// emits on new datagram msg
udpServer.on('message',function(msg,info){
//console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
  for(var i=0; i<msg.length; i+=2){
      fifo.put(msg.slice(i,i+2)); // igy csinalunk monobol stereot
      fifo.put(msg.slice(i,i+2));
      
      
  }
  //fifo.put(msg2);
  //fifo.put(msg);
    
/*
//sending msg
udpServer.send(msg,info.port,'localhost',function(error){
  if(error){
    client.close();
  }else{
    console.log('Data sent !!!');
  }

});*/

});

//emits when socket is ready and listening for datagram msgs
udpServer.on('listening',function(){
  var address = udpServer.address();
  var port = address.port;
  var family = address.family;
  var ipaddr = address.address;
  console.log('Server is listening at port' + port);
  console.log('Server ip :' + ipaddr);
  console.log('Server is IP4/IP6 : ' + family);
});

//emits after the socket is closed using socket.close();
udpServer.on('close',function(){
  console.log('Socket is closed !');
});

udpServer.bind(7355);
/*
setTimeout(function(){
udpServer.close();
},8000);*/


    } catch (error) {
      console.log(error);
      message.channel.send(error.message);
    }
  },
/*
  play(message, song) {
    const queue = message.client.queue;
    const guild = message.guild;
    const serverQueue = queue.get(message.guild.id);

    if (!song) {
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
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }
  */
};
