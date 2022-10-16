const { Relay } = require('bedrock-protocol')
const fs = require('fs');
//const fsPromises = require('fs').promises;

const relay = new Relay({
  version: '1.19.30', // The version
  /* host and port to listen for clients on */
  host: '0.0.0.0',
  port: 19132,
  /* Where to send upstream packets to */
  destination: {
    host: '127.0.0.1',
    port: 30731
  }
})

const logFileName = "./proxyLog - " + (new Date().toLocaleString()).replaceAll('\\', '-').replaceAll('/', '-').replaceAll(':', '-') + ".log"

async function writeLog(logData) {
  try {
    await fs.promises.appendFile(logFileName, logData.toString() + "\n");
  } catch (error) {
    console.error(`Got an error trying to write to a file: ${error.message}`);
  }
}

function csvExcape(data) {
  for (var i = 0; i < data.length; i++) {
    data[i] = data[i].replaceAll('"', '""')
    if (data[i].includes('"') || data[i].includes(',')) {
      data[i] = '"' + data[i] + '"'
    }
  }

  return data.join(',')
}

function paramsToString(data) {
  return( JSON.stringify(data, (key, value) =>
    typeof value === 'bigint'
        ? value.toString()
        : value // return everything else unchanged
  ));
}

const get = (packetName) => {
  return require(`./data/${packetName}.json`);
}

var globalIgnoreRequests = ["resource_pack_chunk_data"]
var clientIgnoreRequests = ["move_player"]
var serverIgnoreRequests = [""]

relay.listen() // Tell the server to start listening.

logData = csvExcape(["receiptient", "name", "json"]);
writeLog(logData);

console.log("Loading files...")
const respawnPacket = get('respawn')
console.log("Ready.");

relay.on('connect', player => {
  console.log('New connection', player.connection.address)

  // Send all the chunks, idc how many u want, client
  for (const file of fs.readdirSync(`./chunks`)) {
    const chunkData = JSON.parse(fs.readFileSync(`./chunks/` + file))
    player.queue("level_chunk", chunkData)
  }

  // Constantly send this packet to the client to tell it the center position for chunks. The client should then request these
  // missing chunks from the us if it's missing any within the radius. `radius` is in blocks.
  loop = setInterval(() => {
    console.log("Sending network chonk")
    for (const file of fs.readdirSync(`./chunks`)) {
      const chunkData = JSON.parse(fs.readFileSync(`./chunks/` + file))
      player.queue("level_chunk", chunkData)
    }
    
    player.write('network_chunk_publisher_update', { coordinates: { x: respawnPacket.position.x, y: 47, z: respawnPacket.position.z }, radius: 160,"saved_chunks":[] })
  }, 4500)

  // Server is sending a message to the client.
  player.on('clientbound', ({ name, params }, options) => {
    if (!globalIgnoreRequests.includes(name) && !clientIgnoreRequests.includes(name)) {
      logData = csvExcape(["clientbound", name, paramsToString(params)]);
      writeLog(logData);
    }

    if (!clientIgnoreRequests.includes(name)) {
      console.log("clientbound - " + name);
    }
    if (name === 'level_chunk') {
      //console.log("replacing chunk")
      options.canceled=true

      // Send all the chunks, idc how many u want, client
      //for (const file of fs.readdirSync(`./chunks`)) {
      //  const chunkData = JSON.parse(fs.readFileSync(`./chunks/` + file))
      //  player.queue("level_chunk", chunkData)
      //}
    } else if (name === "subchunk") {
      options.canceled=true
    } else if (name === "network_chunk_publisher_update") {
      options.canceled=true
      for (const file of fs.readdirSync(`./chunks`)) {
        const chunkData = JSON.parse(fs.readFileSync(`./chunks/` + file))
        player.queue("level_chunk", chunkData)
      }
      player.queue('network_chunk_publisher_update', { coordinates: { x: respawnPacket.position.x, y: 47, z: respawnPacket.position.z }, radius: 160,"saved_chunks":[] })
    }
  })

  // Client is sending a message to the server
  player.on('serverbound', ({ name, params }, options) => {
    if (!globalIgnoreRequests.includes(name) && !serverIgnoreRequests.includes(name)) {
      logData = csvExcape(["serverbound", name, paramsToString(params)]);
      writeLog(logData);
    }

    console.log("serverbound - " + name);

    if (name === 'text') { // Intercept chat message to server and append time.
      params.message += "!";
    } else if (name === 'subchunk_request') {
      //console.log(params);
      let data = JSON.parse(JSON.stringify(params));
    

      options.canceled=true

      //console.log(params)

      //console.log("subchunk request:", data.origin)

      for (const file of fs.readdirSync(`./subchunks`)) {
        // I'm sorry HDD...
        const chunkData = JSON.parse(fs.readFileSync(`./subchunks/` + file))
        // console.log('Sending chunk', buffer)
        //client.sendBuffer(buffer)

        //console.log(file)

        //console.log(chunkData.origin)

        if (chunkData.origin.x === data.origin.x && chunkData.origin.y === data.origin.y && chunkData.origin.z === data.origin.z) {
          //console.log("\n\n\nSending",chunkData.origin,"\n\n\n")
          player.queue("subchunk", chunkData)
        }
      }
    }
  })
})