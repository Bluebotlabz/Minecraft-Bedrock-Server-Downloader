//process.env.DEBUG = 'minecraft-protocol' // packet logging

const fs = require('fs');
const bedrock = require('bedrock-protocol')
const bigJSON = require('json-bigint')({ storeAsString: true, useNativeBigInt: true });

const get = (packetName) => {
  return require(`./data/${packetName}.json`);
}

const server = bedrock.createServer({
  host: '0.0.0.0',       // optional. host to bind as.
  port: 19132,           // optional
  version: '1.19.30',   // optional. The server version, latest if not specified. 
})

console.log("Loading files...")
const respawnPacket = get('respawn')

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
    client.queue("resource_packs_info", {"must_accept":false,"has_scripts":false,"force_server_packs":false,"behaviour_packs":[],"texture_packs":[]})

    // Resource pack response
    client.on('resource_pack_client_response', (data) => {
      if (data.response_status === 'have_all_packs') {
        //client.write('network_settings', { compression_threshold: 1 })
        client.queue("resource_pack_stack", {"must_accept":false,"behavior_packs":[],"resource_packs":[],"game_version":"*","experiments":[],"experiments_previously_used":false})
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
        client.queue('set_time', get('set_time'))
        client.queue('update_adventure_settings', get('update_adventure_settings'))
        client.queue('update_abilities', get('update_abilities'))
        client.queue('game_rules_changed', get('game_rules_changed'))
        client.queue('player_list', get('player_list'))
        client.queue('biome_definition_list', get('biome_definition_list'))
        client.queue('player_fog', get('player_fog'))
        client.queue('available_entity_identifiers', get('available_entity_identifiers'))
        client.queue('update_attributes', get('update_attributes'))
        client.queue('creative_content', get('creative_content'))

        client.queue('inventory_content', {"window_id":"armor","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})
        client.queue('inventory_content', {"window_id":"inventory","input":[{"network_id":217,"count":1,"metadata":0,"has_stack_id":1,"stack_id":13,"block_runtime_id":4192,"extra":{"has_nbt":0,"can_place_on":[],"can_destroy":[]}},{"network_id":-161,"count":1,"metadata":0,"has_stack_id":1,"stack_id":14,"block_runtime_id":6038,"extra":{"has_nbt":0,"can_place_on":[],"can_destroy":[]}},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})
        client.queue('inventory_content', {"window_id":"ui","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})

        //client.queue('inventory_content', get('inventory_content'))
        //client.queue('crafting_data', get('crafting_data'))
        client.queue('player_hotbar', {"selected_slot":0,"window_id":"inventory","select_slot":true})

        //client.queue('available_commands', get('available_commands'))

        //client.queue('set_entity_data', get('set_entity_data'))
        client.queue('entity_evemt', {"runtime_entity_id":"1","event_id":"player_check_treasure_hunter_achievement","data":0})
        client.queue('set_entity_data', {"runtime_entity_id":"1","metadata":[{"key":"flags","type":"long","value":{"onfire":false,"sneaking":false,"riding":false,"sprinting":false,"action":false,"invisible":false,"tempted":false,"inlove":false,"saddled":false,"powered":false,"ignited":false,"baby":false,"converting":false,"critical":false,"can_show_nametag":false,"always_show_nametag":false,"no_ai":false,"silent":false,"wallclimbing":false,"can_climb":true,"swimmer":false,"can_fly":false,"walker":false,"resting":false,"sitting":false,"angry":false,"interested":false,"charged":false,"tamed":false,"orphaned":false,"leashed":false,"sheared":false,"gliding":false,"elder":false,"moving":false,"breathing":true,"chested":false,"stackable":false,"showbase":false,"rearing":false,"vibrating":false,"idling":false,"evoker_spell":false,"charge_attack":false,"wasd_controlled":false,"can_power_jump":false,"linger":false,"has_collision":true,"affected_by_gravity":true,"fire_immune":false,"dancing":false,"enchanted":false,"show_trident_rope":false,"container_private":false,"transforming":false,"spin_attack":false,"swimming":false,"bribed":false,"pregnant":false,"laying_egg":false,"rider_can_pick":false,"transition_sitting":false,"eating":false,"laying_down":false}}],"tick":"0"})
        client.queue('set_health', get('set_health'))

        client.queue('chunk_radius_update', { chunk_radius: 32 })
        client.queue('respawn', get('respawn'))


        //client.queue("network_chunk_publisher_update", {"coordinates":{"x":18,"y":25,"z":-39},"radius":64,"saved_chunks":[]})

        client.queue('network_chunk_publisher_update', { coordinates: { x: respawnPacket.position.x, y: 47, z: respawnPacket.position.z }, radius: 160,"saved_chunks":[] })

        // Send all the chunks, idc how many u want, client
        for (const file of fs.readdirSync(`./chunks`)) {
          const chunkData = JSON.parse(fs.readFileSync(`./chunks/` + file))
          client.queue("level_chunk", chunkData)
        }

        // Send all the entities
        for (const file of fs.readdirSync(`./entities`)) {
          try {
            const entityData = JSON.parse(fs.readFileSync(`./entities/` + file))

            client.queue("add_entity", entityData)
          } catch {
            console.log("error",file)
          }
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

    client.on('inventory_transaction', (data) => {
      console.log("inventory",data)
    })

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