var net = require('net');
async function callGQRX(msg) {
	return new Promise((resolve, reject) => {
		let client = new net.Socket()
		client.setTimeout(1000);
		client.setEncoding("ascii");

		client.connect(7356, '127.0.0.1', () => {
			client.write(msg + `\r\n`)
		})

		client.on('data', (data) => {
			if(data == "RPRT 1\n") reject("Error received");
			else resolve(data);
			client.destroy()
		})

		client.on('close', () => {})

		client.on('error', reject);

		client.on('timeout', () => {
			console.log("GQRX control socket timeout");
			reject('Timeout');
			client.destroy();
		})

	});
}
module.exports = { callGQRX }