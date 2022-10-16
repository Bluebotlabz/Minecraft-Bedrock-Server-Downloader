const fs = require('fs');
const bedrock = require('bedrock-protocol')
//const { join } = require('path')

var serverProperties;
var worldChunks;
var biomeDefinitions;
var entityIdentifiers;

//const getPath = (packetPath) => join(__dirname, `../data/${server.options.version}/${packetPath}`)
//const get = (packetName) => require(getPath(`./data/${packetName}.json`))
const get = (packetName) => require(`./data/${packetName}.json`)

const server = bedrock.createServer({
  host: '0.0.0.0',       // optional. host to bind as.
  port: 19132,           // optional
  version: '1.19.30',   // optional. The server version, latest if not specified. 
})

console.log("Loading files...")
const respawnPacket = get('respawn')

//loadData().then(() => {
//  console.log("Server ready.");
//})

console.log("Server ready.");

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
        //client.write('network_settings', { compression_threshold: 1 })
        client.queue("resource_pack_stack", {"must_accept":true,"behavior_packs":[],"resource_packs":[{"uuid":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","version":"1.0.47","name":""}],"game_version":"*","experiments":[{"name":"spectator_mode","enabled":true},{"name":"data_driven_items","enabled":true}],"experiments_previously_used":true})
      } else if (data.response_status === 'completed') {
        // Client ready
        console.log("client ready");

        client.queue('player_list', get('player_list'))
        client.queue('start_game', get('start_game'))
        client.queue('item_component', { entries: [] })
        client.queue('set_spawn_position', get('set_spawn_position'))
        client.queue('set_time', get('set_time'))
        client.queue('set_difficulty', { difficulty: 1 })
        client.queue('set_commands_enabled', { enabled: true })
        client.queue('update_adventure_settings', get('update_adventure_settings'))
        client.queue('biome_definition_list', get('biome_definition_list'))
        client.queue('available_entity_identifiers', get('available_entity_identifiers'))
        client.queue('update_attributes', get('update_attributes'))
        client.queue('creative_content', get('creative_content'))
        client.queue('inventory_content', get('inventory_content'))
        client.queue('player_hotbar', { selected_slot: 3, window_id: 'inventory', select_slot: true })
        client.queue('crafting_data', get('crafting_data'))
        client.queue('available_commands', get('available_commands'))
        //client.queue('chunk_radius_update', { chunk_radius: 1 })
        client.queue('game_rules_changed', get('game_rules_changed'))
        client.queue('respawn', get('respawn'))


        //client.queue("network_chunk_publisher_update", {"coordinates":{"x":18,"y":25,"z":-39},"radius":64,"saved_chunks":[]})

        // Send all the chunks, idc how many u want, client
        for (const file of fs.readdirSync(`./chunks`)) {
          // I'm sorry HDD...
          const chunkData = JSON.parse(fs.readFileSync(`./chunks/` + file))
          // console.log('Sending chunk', buffer)
          //client.sendBuffer(buffer)

          //console.log(file)

          client.queue("level_chunk", chunkData)
        }

        // Constantly send this packet to the client to tell it the center position for chunks. The client should then request these
        // missing chunks from the us if it's missing any within the radius. `radius` is in blocks.
        loop = setInterval(() => {
          console.log("Sending network chonk")
          client.write('network_chunk_publisher_update', { coordinates: { x: respawnPacket.position.x, y: 47, z: respawnPacket.position.z }, radius: 160,"saved_chunks":[] })
        }, 4500)

        // Wait some time to allow for the client to recieve and load all the chunks
        setTimeout(() => {
          // Allow the client to spawn
          client.write('play_status', { status: 'player_spawn' })
        }, 6000)
      }
    })

    //client.on('subchunk_request', (data) => {
    //  // Send all the chunks, idc how many u want, client
    //  console.log("sending chunk data")
//
    //  client.queue("network_chunk_publisher_update", {"coordinates":{"x":Math.round(clientData.position.x),"y":Math.round(clientData.position.x),"z":Math.round(clientData.position.x)},"radius":64,"saved_chunks":[]})
    //  
    //  for (var i = 0; i < worldChunks.length; i++) {
    //    client.queue("level_chunk", worldChunks[i])
    //  }
    //})

    client.on("subchunk_request", (data) => {
      console.log("subchunk request:", data.origin)

      for (const file of fs.readdirSync(`./subchunks`)) {
        // I'm sorry HDD...
        const chunkData = JSON.parse(fs.readFileSync(`./subchunks/` + file))
        // console.log('Sending chunk', buffer)
        //client.sendBuffer(buffer)

        //console.log(file)

        //console.log(chunkData.origin)

        if (chunkData.origin.x === data.origin.x && chunkData.origin.y === data.origin.y && chunkData.origin.z === data.origin.z) {
          console.log("\n\n\nSending",chunkData.origin,"\n\n\n")
          client.queue("subchunk", chunkData)
        }
      }
    })

    //client.on('move_player', (data) => {
    //  // What is anticheat lol
    //  client.queue("move_player", data)
    //})

    // Respond to tick synchronization packets
    client.on('tick_sync', (packet) => {
      console.log("TICKEROOOOOO")
      client.queue('tick_sync', {
        request_time: packet.request_time,
        response_time: BigInt(Date.now())
      })
    })

    //client.on('resource_pack_client_response')
    // We can listen for text packets. See proto.yml for documentation.
    client.on('text', (packet) => {
      console.log('Client got text packet', packet)
    })
  })
})