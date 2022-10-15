const { Relay } = require('bedrock-protocol')
const fs = require('fs').promises;

const relay = new Relay({
  version: '1.19.30', // The version
  /* host and port to listen for clients on */
  host: '0.0.0.0',
  port: 19132,
  /* Where to send upstream packets to */
  destination: {
    host: '40.115.98.220',
    port: 30134
  }
})

const logFileName = "./proxyLog - " + (new Date().toLocaleString()).replaceAll('\\', '-').replaceAll('/', '-').replaceAll(':', '-') + ".log"

async function writeLog(logData) {
  try {
    await fs.appendFile(logFileName, logData.toString() + "\n");
  } catch (error) {
    console.error(`Got an error trying to write to a file: ${error.message}`);
  }
}

function csvExcape(data) {
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].replaceAll('"', '""')
    if (data[i].includes('"') || data[i].includes(',')) {
      data[i] = '"' + data[i] + '"'
    }
  }

  return data[i].join(',')
}

relay.listen() // Tell the server to start listening.

logData = csvExcape(["receiptient", name, JSON.stringify(params)]);
writeLog(logData);

console.log("Ready.");

relay.on('connect', player => {
  console.log('New connection', player.connection.address)

  // Server is sending a message to the client.
  player.on('clientbound', ({ name, params }) => {
    logData = csvExcape(["clientbound", name, JSON.stringify(params)]);
    writeLog(logData);

    if (name !== 'resource_pack_chunk_data') {
      console.log("clientbound - " + name);
    }

    if (name === 'disconnect') { // Intercept kick
      params.message = 'Intercepted' // Change kick message to "Intercepted"
    }
  })

  // Client is sending a message to the server
  player.on('serverbound', ({ name, params }) => {
    logData = csvExcape(["serverbound", name, JSON.stringify(params)]);
    writeLog(logData);

    if (name !== 'resource_pack_chunk_data') {
      console.log("serverbound - " + name);
    }

    if (name === 'text') { // Intercept chat message to server and append time.
      //params.message += `, on ${new Date().toLocaleString()}`
      params.message += "!";
    }
  })
})

//const bedrock = require('bedrock-protocol')
//const server = bedrock.createServer({
//  host: '0.0.0.0',       // optional. host to bind as.
//  port: 19132,           // optional
//  version: '1.19.30',   // optional. The server version, latest if not specified. 
//})
//
//server.on('connect', client => {
//  client.on('join', () => { // The client has joined the server.
//    const d = new Date()  // Once client is in the server, send a colorful kick message
//    client.disconnect(`Good ${d.getHours() < 12 ? '§emorning§r' : '§3afternoon§r'} :)\n\nMy time is ${d.toLocaleString()} !`)
//  })
//})