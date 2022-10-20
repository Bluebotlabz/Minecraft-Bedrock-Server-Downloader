const { Relay } = require('bedrock-protocol')
const fs = require('fs');

const relay = new Relay({
  version: '1.19.30', // The version
  /* host and port to listen for clients on */
  host: '0.0.0.0',
  port: 19132,
  /* Where to send upstream packets to */
  //destination: {
  //  host: '40.115.98.220',
  //  port: 30731
  //}
  destination: {
    host: '127.0.0.1',
    port: 30731
  }
})

const proxyPacketOutputFolder = "./proxyOutput/"
try {
  fs.rmSync(proxyPacketOutputFolder, {recursive: true})
} catch {}
try {
  fs.mkdirSync(proxyPacketOutputFolder)
} catch {}


const logFileName = proxyPacketOutputFolder + "/proxyLog - " + (new Date().toLocaleString()).replaceAll('\\', '-').replaceAll('/', '-').replaceAll(':', '-') + ".log"


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

function convertPacketToJson(name, params, isClientBound) {
  // Define special packets and their folder names
  const specialPackets = {
    "level_chunk": null, // Managed seperately
    "subchunk": null, // Managed seperately
    "add_entity": "entities",
    "add_painting": "paintings",
    "npc_dialogue": "npc_dialogue",
    "npc_request": "npc_request"
  }

  // Pre-convert params to JSON
  const stringParams = JSON.stringify(params, (key, value) => {
    if (key == "_value") {
      return null
    } else if (typeof value == 'bigint') {
      return value.toString()
    } else {
      return value
    }
  })

  // Only save clientbound data
  if (isClientBound) {
    if (!Object.keys(specialPackets).includes(name)) { // Generic packets
      try {
        fs.mkdirSync(proxyPacketOutputFolder + "/data/")
      } catch {}

      fs.writeFileSync(proxyPacketOutputFolder + "/data/" + name + ".json", stringParams)

    } else if (name === "level_chunk") { // Chunk packets
      try {
        fs.mkdirSync(proxyPacketOutputFolder + "/chunkdata/")
      } catch {}

      try {
        let chunks = JSON.parse(fs.readFileSync(proxyPacketOutputFolder + "chunkdata/chunks.json"))
        chunks.push(params)

        fs.writeFileSync(proxyPacketOutputFolder + "/chunkdata/chunks.json", JSON.stringify(chunks))
      } catch {
        let chunks = [params]
        fs.writeFileSync(proxyPacketOutputFolder + "/chunkdata/chunks.json", JSON.stringify(chunks))
      }
    
    } else if (name === "subchunk") { // Subchunk packets
      try {
        fs.mkdirSync(proxyPacketOutputFolder + "/chunkdata/")
      } catch {}

      const subchunkFilename = proxyPacketOutputFolder + "/chunkdata/subchunk_" + params.origin.x.toString() + "_" + params.origin.y.toString() + "_" + params.origin.z.toString() + ".json"

      try {
        var subchunkData = JSON.parse(fs.readFileSync(subchunkFilename))
      } catch {
        var subchunkData = Object.assign({}, params)

        subchunkData.entries = {}
      }

      for (let subchunkEntry of params.entries) {
        subchunkData.entries[subchunkEntry.dx.toString() + "_" + subchunkEntry.dy.toString() + "_" + subchunkEntry.dz.toString()] = subchunkEntry
      }

      fs.writeFileSync(subchunkFilename, JSON.stringify(subchunkData))
    
    } else if (name === "add_entity" || name === "add_painting") {
      // "Normalize" name
      name = specialPackets[name]

      try {
        fs.mkdirSync(proxyPacketOutputFolder + "/" + name + "/")
      } catch {}

      // Get index
      if (name === "entities") {
        var fileIndex = params.runtime_id
      } else {
        var fileIndex = params.runtime_entity_id
      }

      fs.writeFileSync(proxyPacketOutputFolder + "/" + name + "/" + name + "_" + fileIndex.toString() + ".json", stringParams)
    } else { // "Special" numbered packets
      // "Normalize" name
      name = specialPackets[name]

      try {
        var folderContents = fs.readdirSync(proxyPacketOutputFolder + name + "/")

        var packetIndex = folderContents[folderContents.length-1]
        packetIndex = packetIndex.substring(0, packetIndex.length-5).substring(name.length+1)
        packetIndex = Number(packetIndex)
      } catch {
        fs.mkdirSync(proxyPacketOutputFolder + name + "/")
        var packetIndex = -1
      }

      packetIndex++

      fs.writeFileSync(proxyPacketOutputFolder + "/" + name + "/" + name + "_" + packetIndex.toString() + ".json", stringParams)
    }
  }
}

var globalIgnoreRequests = ["resource_pack_chunk_data"]
var clientIgnoreRequests = ["move_player"]
var serverIgnoreRequests = [""]

relay.listen() // Tell the server to start listening.

logData = csvExcape(["receiptient", "name", "json"]);
writeLog(logData);

console.log("Ready.");

relay.on('connect', player => {
  console.log('New connection', player.connection.address)

  // Server is sending a message to the client.
  player.on('clientbound', ({ name, params }) => {
    if (!globalIgnoreRequests.includes(name) && !clientIgnoreRequests.includes(name)) {
      logData = csvExcape(["clientbound", name, paramsToString(params)]);
      writeLog(logData);

      convertPacketToJson(name, params, true);
    }

    if (!clientIgnoreRequests.includes(name)) {
      console.log("clientbound - " + name)
    }

    if (name === 'disconnect') { // Intercept kick
      //params.message = 'Intercepted' // Change kick message to "Intercepted"
    }
  })

  // Client is sending a message to the server
  player.on('serverbound', ({ name, params }) => {
    if (!globalIgnoreRequests.includes(name) && !serverIgnoreRequests.includes(name)) {
      logData = csvExcape(["serverbound", name, paramsToString(params)]);
      writeLog(logData);

      convertPacketToJson(name, params, false);
    }

    console.log("serverbound - " + name)

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