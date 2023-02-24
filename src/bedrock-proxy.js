const { Relay } = require('bedrock-protocol')
const path = require('path')
const fs = require('fs');

const relay = new Relay({
  version: '1.19.40',
  host: '0.0.0.0',
  port: 19132,
  destination: {
    host: process.argv[2],
    port: parseInt(process.argv[3])
  }
})

const fs = require('fs');
const path = require('path');

const proxyPacketOutputFolder = "./proxyOutput";

if (!fs.existsSync(proxyPacketOutputFolder)) {
  fs.mkdirSync(proxyPacketOutputFolder);
}

const logFileName = path.join(proxyPacketOutputFolder, `proxyLog - ${new Date().toLocaleString().replace(/[\/\\:]/g, '-')}.log`);

function writeLog(logData) {
  try {
    fs.appendFileSync(logFileName, `${logData}\n`);
  } catch (error) {
    console.error(`Error while writing to file: ${error.message}`);
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
  return (JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
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
      } catch { }

      fs.writeFileSync(proxyPacketOutputFolder + "/data/" + name + ".json", stringParams)

    } else if (name === "level_chunk") { // Chunk packets
      fs.mkdirSync(proxyPacketOutputFolder + "/chunkdata/")

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
      } catch { }

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
      } catch { }

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

        var packetIndex = folderContents[folderContents.length - 1]
        packetIndex = packetIndex.substring(0, packetIndex.length - 5).substring(name.length + 1)
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


let globalLogIgnoreRequests = ["resource_pack_chunk_data"] // TODO: Convert to json files?
let clientLogIgnoreRequests = [""]
let serverLogIgnoreRequests = [""]

relay.listen()

logData = csvExcape(["receiptient", "name", "json"]);
writeLog(logData);

console.log("Ready!");

relay.on('connect', player => {
  console.log('New connection', player.connection.address)

  // Server is sending a message to the client.
  player.on('clientbound', ({ name, params }) => {
    if (!globalLogIgnoreRequests.includes(name) && !clientLogIgnoreRequests.includes(name)) {
      logData = csvExcape(["clientbound", name, paramsToString(params)]);
      writeLog(logData);

      convertPacketToJson(name, params, true);
    }

    if (!clientLogIgnoreRequests.includes(name)) {
      console.log("clientbound - " + name)
    }
  })

  // Client is sending a message to the server
  player.on('serverbound', ({ name, params }) => {
    if (!globalLogIgnoreRequests.includes(name) && !serverLogIgnoreRequests.includes(name)) {
      logData = csvExcape(["serverbound", name, paramsToString(params)]);
      writeLog(logData);

      convertPacketToJson(name, params, false);
    }

    console.log("serverbound - " + name)

    if (name === 'text') {
      params.message += "!";
    }
  })
})
