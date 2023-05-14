const { Relay } = require('bedrock-protocol')
const colors = require('colors/safe')
const fetch = require('sync-fetch')
const path = require('path')
const fs = require('fs');

if (process.argv.length === 2 || process.argv.length > 5) { 
  console.error('Expected at least one argument!');
  console.log(`
  Usage:
  node bedrock-proxy.js <target IP>
  node bedrock-proxy.js <target IP> [target Port]

  <target IP>   - IP of server to proxy
  [target Port] - Port of server to proxy (optional, default: 19132)


  Usage (with venues API to automatically determine IP/Port):
  node bedrock-proxy.js --gathering <Venue UUID> <Auth Token>

  <Venue UUID> - The UUID of the Venue, ie: d6c64a9d-509e-4c33-92be-ac7edbc1b800 (for legends event)
  <Auth Token> - The auth token used by the API, starts with "MCToken"


  Connecting:
  By default listens on 0.0.0.0:19132
  You may need to enable UWP loopback for Minecraft, for more information see:
  https://doc.pmmp.io/en/rtfd/faq/connecting/win10localhostcantconnect.html
  `)
  process.exit(1);
}

let targetIP = "";
let targetPort = 19132;

if (process.argv.length < 5) { // Not using venue
  targetIP = process.argv[2];
  if (process.argv[3]) {
    targetPort = process.argv[3];
  }
} else { // Using venues
  /**
   * Gatherings API Code
   * Requires an API Token
  */

  console.log("Operating in Venue mode... Querying API...\n")
  // Thanks to @JustTalDevelops for figuring out how this worked
  const ipInfo = fetch("https://gatherings.franchise.minecraft-services.net/api/v1.0/venue/" + process.argv[3], {
    method: "GET",
    headers: {
        "authorization": process.argv[4]
    }
  }).json();
  targetIP = ipInfo.result.venue.serverIpAddress;
  targetPort = ipInfo.result.venue.serverPort;
}

console.log("IP: ", targetIP)
console.log("Port: ", targetPort)

const relay = new Relay({
  version: '1.19.80', // The version
  /* host and port to listen for clients on */
  host: '0.0.0.0',
  port: 19132,
  destination: {
    host: targetIP,
    port: targetPort
  }
})

// Delete output dir and recreate it
const proxyPacketOutputFolder = "./proxyOutput/"
if (!fs.existsSync(proxyPacketOutputFolder)) {
  fs.mkdirSync(proxyPacketOutputFolder);
}

// Create logfile
const logFileName = path.join(proxyPacketOutputFolder, `proxyLog - ${new Date().toLocaleString().replace(/[\/\\:]/g, '-')}.log`);

var logBuffer = [];
var logBufferLength = 100; // Cache 50 items in ram then writeout

// Function used to write logfile
function writeLog(logData) {
  logBuffer.push(logData.toString() + "\n")
  
  if (logBuffer.length >= logBufferLength) {
    let writeOut = "";
    for (let i=0; i < logBuffer.length; i++) {
      writeOut += logBuffer[i]
    }
    logBuffer = []

    fs.appendFileSync(logFileName, writeOut)
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



relay.listen() // Tell the server to start listening.

logData = csvExcape(["time","receiptient", "name", "json"]);
writeLog(logData);

console.log(colors.green("Ready."));
var startTime = 0;

relay.on('connect', player => {
  console.log('New connection', player.connection.address)
  startTime = Date.now();

  // Handle write out existing buffer on disconnect
  player.on('close', (reason) => {
    console.log("Connectin closed!");
    console.log("Writing out buffer");


    let writeOut = "";
    for (let i=0; i < logBuffer.length; i++) {
      writeOut += logBuffer[i]
    }
    logBuffer = []

    fs.appendFileSync(logFileName, writeOut)

    console.log("Done!")
  })

  // Server is sending a message to the client.
  player.on('clientbound', ({ name, params }) => {
    logData = csvExcape([(Date.now()-startTime).toString(), "clientbound", name, paramsToString(params)]);
    writeLog(logData);
  })

  // Client is sending a message to the server
  player.on('serverbound', ({ name, params }) => {
    logData = csvExcape([(Date.now()-startTime).toString(), "serverbound", name, paramsToString(params)]);
    writeLog(logData);
  })
})