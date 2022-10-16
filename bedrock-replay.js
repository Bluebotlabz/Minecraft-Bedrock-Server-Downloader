const fs = require('fs').promises;
const bedrock = require('bedrock-protocol')

var serverProperties;
var worldChunks;
var biomeDefinitions;
var entityIdentifiers;

async function loadData() {
  serverProperties = JSON.parse(await fs.readFile("./properties.json", { encoding: 'utf8' }))
  worldChunks = JSON.parse(await fs.readFile("./chunkData.json", { encoding: 'utf8' }))
  biomeDefinitions = JSON.parse(await fs.readFile("./biomeDefinitions.json", { encoding: 'utf8' }))
  entityIdentifiers = JSON.parse(await fs.readFile("./entityIdentifiers.json", { encoding: 'utf8' }))
  playerList = JSON.parse(await fs.readFile("./playerList.json", { encoding: 'utf8' }))
}

const server = bedrock.createServer({
  host: '0.0.0.0',       // optional. host to bind as.
  port: 19132,           // optional
  version: '1.19.30',   // optional. The server version, latest if not specified. 
})

console.log("Loading files...")
clientData = {"position": {"x": 0, "y": 0, "z": 0}}

loadData().then(() => {
  console.log("Server ready.");
})

server.on('connect', client => {
  client.on('join', () => { // The client has joined the server.
    //const d = new Date()  // Once client is in the server, send a colorful kick message
    //client.disconnect(`Good ${d.getHours() < 12 ? '§emorning§r' : '§3afternoon§r'} :)\n\nMy time is ${d.toLocaleString()} !`)
    //client.disconnect("hello");

    client.on('packet', (packet) => {
      console.log('Got client packet', packet)
    })

    console.log('New connection', client.connection.address)

    // Send resource pack data (on join)
    client.queue("resource_packs_info", {"must_accept":true,"has_scripts":false,"force_server_packs":false,"behaviour_packs":[],"texture_packs":[{"uuid":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","version":"1.0.47","size":[0,8544714],"content_key":"","sub_pack_name":"","content_identity":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","has_scripts":false,"rtx_enabled":false}]})

    // Resource pack response
    client.on('resource_pack_client_response', (data) => {
      if (data.response_status === 'have_all_packs') {
        client.queue("resource_pack_stack", {"must_accept":true,"behavior_packs":[],"resource_packs":[{"uuid":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","version":"1.0.47","name":""}],"game_version":"*","experiments":[{"name":"spectator_mode","enabled":true},{"name":"data_driven_items","enabled":true}],"experiments_previously_used":true})
      } else if (data.response_status === 'completed') {
        // Client ready
        console.log("client ready");

        client.queue("start_game", serverProperties)
        client.queue("set_time", {"time": 73000})
        client.queue("set_spawn_position", {"spawn_type":"player","player_position":{"x":-2147483648,"y":-2147483648,"z":-2147483648},"dimension":3,"world_position":{"x":-2147483648,"y":-2147483648,"z":-2147483648}})
        client.queue("set_difficulty", {"difficulty": 1})
        client.queue("set_commands_enabled", {"enabled": true})
        client.queue("set_time", {"time": 73000})
        client.queue("update_adventure_settings", {"no_pvm":false,"no_mvp":false,"immutable_world":false,"show_name_tags":false,"auto_jump":true})
        client.queue("game_rules_changed", {"rules":[{"name":"commandblockoutput","editable":true,"type":"bool","value":true},{"name":"dodaylightcycle","editable":true,"type":"bool","value":false},{"name":"doentitydrops","editable":true,"type":"bool","value":true},{"name":"dofiretick","editable":true,"type":"bool","value":true},{"name":"domobloot","editable":true,"type":"bool","value":false},{"name":"domobspawning","editable":true,"type":"bool","value":false},{"name":"dotiledrops","editable":true,"type":"bool","value":true},{"name":"doweathercycle","editable":true,"type":"bool","value":false},{"name":"drowningdamage","editable":true,"type":"bool","value":true},{"name":"falldamage","editable":true,"type":"bool","value":false},{"name":"firedamage","editable":true,"type":"bool","value":true},{"name":"keepinventory","editable":true,"type":"bool","value":true},{"name":"mobgriefing","editable":true,"type":"bool","value":false},{"name":"pvp","editable":true,"type":"bool","value":false},{"name":"showcoordinates","editable":true,"type":"bool","value":false},{"name":"naturalregeneration","editable":true,"type":"bool","value":false},{"name":"tntexplodes","editable":true,"type":"bool","value":true},{"name":"sendcommandfeedback","editable":true,"type":"bool","value":false},{"name":"maxcommandchainlength","editable":true,"type":"int","value":65536},{"name":"doinsomnia","editable":true,"type":"bool","value":true},{"name":"commandblocksenabled","editable":true,"type":"bool","value":false},{"name":"randomtickspeed","editable":true,"type":"int","value":0},{"name":"doimmediaterespawn","editable":true,"type":"bool","value":true},{"name":"showdeathmessages","editable":true,"type":"bool","value":false},{"name":"functioncommandlimit","editable":true,"type":"int","value":10000},{"name":"spawnradius","editable":true,"type":"int","value":10},{"name":"showtags","editable":true,"type":"bool","value":true},{"name":"freezedamage","editable":true,"type":"bool","value":true},{"name":"respawnblocksexplode","editable":true,"type":"bool","value":true},{"name":"showbordereffect","editable":true,"type":"bool","value":true}]})
        client.queue("player_list", playerList)
        client.queue("biome_definition_list", biomeDefinitions)
        client.queue("available_entity_identifiers", entityIdentifiers)
        client.queue("player_fog", {"stack": []})
        client.queue("set_health", {"health": 20})
        client.queue("play_status", {"status":"player_spawn"})


        client.queue("network_chunk_publisher_update", {"coordinates":{"x":18,"y":25,"z":-39},"radius":64,"saved_chunks":[]})

        // Send all the chunks, idc how many u want, client
        console.log("sending chunks")
        for (var i = 0; i < worldChunks.length; i++) {
          client.queue("level_chunk", worldChunks[i])
        }
      }
    })

    client.on('subchunk_request', (data) => {
      // Send all the chunks, idc how many u want, client
      console.log("sending chunk data")

      client.queue("network_chunk_publisher_update", {"coordinates":{"x":Math.round(clientData.position.x),"y":Math.round(clientData.position.x),"z":Math.round(clientData.position.x)},"radius":64,"saved_chunks":[]})
      
      for (var i = 0; i < worldChunks.length; i++) {
        client.queue("level_chunk", worldChunks[i])
      }
    })

    client.on('move_player', (data) => {
      // What is anticheat lol
      client.queue("move_player", data)

      clientData.position = data.position;
    })

    client.on("tick_sync", (data) => {
      // This will definitely break something
      client.queue("tick_sync", data)
    })

    //client.on('resource_pack_client_response')
    // We can listen for text packets. See proto.yml for documentation.
    client.on('text', (packet) => {
      console.log('Client got text packet', packet)
    })
  })
})