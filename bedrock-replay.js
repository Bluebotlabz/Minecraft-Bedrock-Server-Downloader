//process.env.DEBUG = 'minecraft-protocol' // packet logging

const fs = require('fs');
const bedrock = require('bedrock-protocol');
const colors = require('colors/safe');
const { exit } = require('process');
const Long = require('long');

const get = (packetName) => {
  return require(`./data/${packetName}.json`);
}

// Create server
const server = bedrock.createServer({
  host: '0.0.0.0',       // optional. host to bind as.
  port: 19132,           // optional
  version: '1.19.30',   // optional. The server version, latest if not specified. 
})

console.log("Loading files...")
const respawnPacket = get('respawn')
const allEntities = JSON.parse(fs.readFileSync(`./data/entities.json`), (key, value) => {
  if (key == "_value") {
    return null
  } else {
    return value
  }
})

console.log("Loading plugins...")
const pluginList = fs.readdirSync("./plugins/")
var plugins = []
for (pluginFile of pluginList) {
  if (pluginFile.includes(".js")) { // Should be a js file
    require("./plugins/" + pluginFile)(server)
  }
}

console.log(colors.green("Server ready."));



server.on('connect', client => {
  client.on('join', () => {
    // Debug client packets
    //client.on('packet', (packet) => {
    //  console.log('Got client packet', packet)
    //})

    // Log client connection
    console.log('New connection', client.connection.address)

    // Send resource pack data (on join)
    client.queue("resource_packs_info", {"must_accept":true,"has_scripts":false,"force_server_packs":false,"behaviour_packs":[],"texture_packs":[{"uuid":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","version":"1.0.47","size":[0,8544714],"content_key":"","sub_pack_name":"","content_identity":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","has_scripts":false,"rtx_enabled":false}]})

    // Resource pack response
    client.on('resource_pack_client_response', (data) => {
      if (data.response_status === 'have_all_packs') {
        //client.write('network_settings', { compression_threshold: 1 })
        // Force client to use the cached mob vote resource pack
        client.queue("resource_pack_stack", {"must_accept":true,"behavior_packs":[],"resource_packs":[{"uuid":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","version":"1.0.47","name":""}],"game_version":"*","experiments":[{"name":"spectator_mode","enabled":true},{"name":"data_driven_items","enabled":true}],"experiments_previously_used":true})
      } else if (data.response_status === 'completed') {
        // Client ready
        console.log("client ready");



        // Send the "initialization packets"
        //client.queue('player_list', get('player_list'))
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
        //client.queue('player_list', get('player_list'))
        client.queue('biome_definition_list', get('biome_definition_list'))
        client.queue('player_fog', get('player_fog'))
        client.queue('available_entity_identifiers', get('available_entity_identifiers'))
        client.queue('update_attributes', get('update_attributes'))
        client.queue('creative_content', get('creative_content'))

        client.queue('inventory_content', {"window_id":"armor","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})
        client.queue('inventory_content', {"window_id":"inventory","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})
        client.queue('inventory_content', {"window_id":"ui","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})

        //client.queue('inventory_content', get('inventory_content'))
        //client.queue('crafting_data', get('crafting_data'))

        client.queue('player_hotbar', {"selected_slot":0,"window_id":"inventory","select_slot":true})

        //client.queue('available_commands', get('available_commands'))

        //client.queue('set_entity_data', get('set_entity_data'))
        client.queue('entity_event', {"runtime_entity_id":"1","event_id":"player_check_treasure_hunter_achievement","data":0})
        client.queue('set_entity_data', {"runtime_entity_id":"1","metadata":[{"key":"flags","type":"long","value":{"onfire":false,"sneaking":false,"riding":false,"sprinting":false,"action":false,"invisible":false,"tempted":false,"inlove":false,"saddled":false,"powered":false,"ignited":false,"baby":false,"converting":false,"critical":false,"can_show_nametag":false,"always_show_nametag":false,"no_ai":false,"silent":false,"wallclimbing":false,"can_climb":true,"swimmer":false,"can_fly":false,"walker":false,"resting":false,"sitting":false,"angry":false,"interested":false,"charged":false,"tamed":false,"orphaned":false,"leashed":false,"sheared":false,"gliding":false,"elder":false,"moving":false,"breathing":true,"chested":false,"stackable":false,"showbase":false,"rearing":false,"vibrating":false,"idling":false,"evoker_spell":false,"charge_attack":false,"wasd_controlled":false,"can_power_jump":false,"linger":false,"has_collision":true,"affected_by_gravity":true,"fire_immune":false,"dancing":false,"enchanted":false,"show_trident_rope":false,"container_private":false,"transforming":false,"spin_attack":false,"swimming":false,"bribed":false,"pregnant":false,"laying_egg":false,"rider_can_pick":false,"transition_sitting":false,"eating":false,"laying_down":false}}],"tick":"0"})
        client.queue('set_health', get('set_health'))

        client.queue('chunk_radius_update', { chunk_radius: 32 })
        client.queue('respawn', get('respawn'))



        // Send chunk publisher update
        client.queue('network_chunk_publisher_update', { coordinates: { x: respawnPacket.position.x, y: 47, z: respawnPacket.position.z }, radius: 160,"saved_chunks":[] })

        // Send all the chunks in the chunk file
        const chunkData = JSON.parse(fs.readFileSync(`./chunkdata/chunks.json`))
        for (const chunkPacket of chunkData) {
          client.queue("level_chunk", chunkPacket)
        }

        // Send all paintings
        const paintingData = JSON.parse(fs.readFileSync(`./data/paintings.json`))
        for (const painting in paintingData) {
          client.queue("add_painting", paintingData[painting])
        }

        // Send all the entities
        for (const entity in allEntities) {
          client.queue("add_entity", allEntities[entity])
        }


        // Constantly send this packet to the client to tell it the center position for chunks. The client should then request these
        // missing chunks from the us if it's missing any within the radius. `radius` is in blocks.
        // TODO: Make better
        loop = setInterval(() => {
          client.write('network_chunk_publisher_update', { coordinates: { x: respawnPacket.position.x, y: 47, z: respawnPacket.position.z }, radius: 160,"saved_chunks":[] })
        }, 4500)

        // Wait some time to allow for the client to recieve and load all the chunks
        setTimeout(() => {
          // Allow the client to spawn
          client.write('play_status', { status: 'player_spawn' })
        }, 6000)
      }
    })

    // Handle client subchunk requests
    client.on("subchunk_request", (data) => {
      try {
        // Generate subchunk file path and parse its JSON
        const subchunkFile = JSON.parse(fs.readFileSync("./chunkdata/subchunk_" + String(data.origin.x) + "_" + String(data.origin.y) + "_" + String(data.origin.z) + ".json"))

        // Create skeleton response
        let subchunkData = {
          cache_enabled: subchunkFile.cache_enabled,
          dimension: subchunkFile.dimension,
          origin: subchunkFile.origin,
          entries: []
        }

        // For every requested "subsubchunk", add it to the response if it exists
        for (const request of data.requests) {
          const subSubchunkKey = String(request.dx) + "_" + String(request.dy) + "_" + String(request.dz)

          if (Object.keys(subchunkFile.entries).includes(subSubchunkKey)) {
            subchunkData.entries.push(subchunkFile.entries[subSubchunkKey])
          } else {
            console.warn(colors.yellow("WARN: Client requested subsubchunk", subSubchunkKey, "but it was not found, falling back to sending all existing subsubchunks!"))

            subchunkData.entries = []

            for (const subchunkEntry in subchunkFile.entries) {
              subchunkData.entries.push(subchunkFile.entries[subchunkEntry])
            }

            break;
          }
        }

        // Send the response
        client.queue("subchunk", subchunkData)
      } catch (e) {
        // If there is an error, send warning to console
        if (e.code === 'ENOENT' && e.syscall === 'open') {
          console.warn(colors.yellow("WARN: Client requested subchunk", e.path, "but it was not found, ignoring request"))
        }
      }
    })

    // Commands
    client.on('command_request', (data) => {
      commandData = data.command.split(' ')

      try {
        switch (commandData[0]) {
          case "/stop": // Stops the server
            client.disconnect("The Server Has Stopped")
            client.close()
            exit()
          case "/rawpacket": // Sends the client the specified packet with data
            client.queue(commandData[1], JSON.parse(commandData.slice(2, commandData.length).join(' ')))
            break
          case "/dialogue": // Debug test dialogue
            client.queue("npc_dialogue", {"entity_id":[4294967203,341],"action_type":"open","dialogue":"","screen_name":"","npc_name":"","action_json":""})
            break
        }
      } catch (e) {
        console.error(e)
      }
    })

    client.on('inventory_transaction', (data) => {
      if (data.transaction.transaction_type == "item_use_on_entity") {
        // Get entity data
        entityData = allEntities[data.transaction.transaction_data.entity_runtime_id]

        // Go through entity attributes to determine type
        for (entityAttribute of entityData.metadata) {
          switch (entityAttribute.key) {
            case "npc_skin_id": // Entity is an NPC
              const actorID = Long.fromString(entityData.unique_id)
              const actorIDList = [actorID.getHighBitsUnsigned(), actorID.getLowBitsUnsigned()]

              client.queue("npc_dialogue", {"entity_id":actorIDList,"action_type":"open","dialogue":"","screen_name":"","npc_name":"","action_json":""})
              break
            default:
              // If it doesn't match the switch, then "continue" the loop
              continue
          }

          // Exit for loop once switch has executed
          break
        }
      }
    })

    // Respond to tick synchronization packets
    client.on('tick_sync', (packet) => {
      client.queue('tick_sync', {
        request_time: packet.request_time,
        response_time: BigInt(Date.now())
      })
    })
  })
})