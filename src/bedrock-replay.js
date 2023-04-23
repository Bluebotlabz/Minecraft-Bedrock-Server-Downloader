const fs = require('fs');
const bedrock = require('bedrock-protocol');
const colors = require('colors/safe');
const { exit } = require('process');
const Long = require('long');

const get = (packetName) => {
  return require(`./data/${packetName}.json`);
}

const tryGet = (client, packetName) => {
  try {  
    const data = get(packetName)
    
    client.queue(packetName, data)
  } catch (e) {}
}

// Create server
const server = bedrock.createServer({
  host: '0.0.0.0',       // optional. host to bind as.
  port: 19132           // optional
})

console.log("Loading files...")

let serverData = {
  respawnPacket: get('respawn'),
  startGame: get('start_game'),
  entities: {},
  paintings: {},
  chunks: [],
  subchunks: {},
  players: {}
}

// Load all entities into single JS object
const entityList = fs.readdirSync("./entities/")
for (entityFilename of entityList) {
  entityData = JSON.parse(fs.readFileSync(`./entities/` + entityFilename), (key, value) => {
    if (key == "_value") {
      return null
    } else {
      return value
    }
  })

  serverData.entities[entityData.runtime_id] = entityData
}

// Load all paintings into single JS object
const paintingList = fs.readdirSync("./paintings/")
for (paintingFilename of paintingList) {
  paintingData = JSON.parse(fs.readFileSync(`./paintings/` + paintingFilename))

  serverData.paintings[paintingData.runtime_entity_id] = paintingData
}

// Load chunk data
serverData.chunks = JSON.parse(fs.readFileSync("./chunkdata/chunks.json"))

// Load subchunk data
const subchunkList = fs.readdirSync("./chunkdata/")
for (subchunk of subchunkList) {
  if (subchunk.includes("subchunk_")) {
    serverData.subchunks[ subchunk.substring(9, subchunk.length-5) ] = JSON.parse(fs.readFileSync("./chunkdata/" + subchunk))
  }
}

// Load (execute) plugins
console.log("Loading plugins...")
const pluginList = fs.readdirSync("./plugins/")
for (pluginFile of pluginList) {
  if (pluginFile.includes(".js")) { // Should be a js file
    // Execute the plugin (and also give it required data)
    require("./plugins/" + pluginFile)(server, serverData)
  }
}

console.log(colors.green("Server ready."));



server.on('connect', client => {
  client.on('join', () => {
    // Log client connection
    console.log('New connection', client.connection.address)
    serverData.players[client.profile.uuid] = {}

    // Send resource pack data (on join)
    client.queue("resource_packs_info", {"must_accept":false,"has_scripts":false,"force_server_packs":false,"behaviour_packs":[],"texture_packs":[]})

    // Resource pack response
    client.on('resource_pack_client_response', (data) => {
      if (data.response_status === 'have_all_packs') {
        client.queue("resource_pack_stack", {"must_accept":true,"behavior_packs":[],"resource_packs":[],"game_version":"*","experiments":[],"experiments_previously_used":false})
      } else if (data.response_status === 'completed') {
        console.log("Client is ready");

        // Send the initialization packets
        serverData.players[client.profile.uuid].start_game = serverData.startGame
        serverData.players[client.profile.uuid].runtime_entity_id = "1"
        serverData.players[client.profile.uuid].entity_id = "-236223166499"
        serverData.players[client.profile.uuid].start_game.runtime_entity_id = serverData.players[client.profile.uuid].runtime_entity_id
        serverData.players[client.profile.uuid].start_game.entity_id = serverData.players[client.profile.uuid].entity_id

        client.queue('start_game', serverData.players[client.profile.uuid].start_game)

        client.queue('item_component', { entries: [] })
        client.queue('set_spawn_position', get('set_spawn_position'))
        client.queue('set_time', get('set_time'))
        client.queue('set_difficulty', { difficulty: 1 })
        client.queue('set_commands_enabled', { enabled: true })
        client.queue('set_time', get('set_time'))
        client.queue('update_adventure_settings', get('update_adventure_settings'))
        client.queue('update_abilities', get('update_abilities'))
        client.queue('game_rules_changed', get('game_rules_changed'))
        tryGet(client, "player_list")
        client.queue('biome_definition_list', get('biome_definition_list'))
        client.queue('player_fog', get('player_fog'))
        client.queue('available_entity_identifiers', get('available_entity_identifiers'))
        client.queue('update_attributes', get('update_attributes'))
        client.queue('creative_content', get('creative_content'))

        client.queue('inventory_content', {"window_id":"armor","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})
        client.queue('inventory_content', {"window_id":"inventory","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})
        client.queue('inventory_content', {"window_id":"ui","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})

        tryGet(client, "available_commands")
        tryGet(client, "crafting_data")

        client.queue('player_hotbar', {"selected_slot":0,"window_id":"inventory","select_slot":true})

        client.queue('available_commands', get('available_commands'))

        client.queue('entity_event', {"runtime_entity_id":"1","event_id":"player_check_treasure_hunter_achievement","data":0})
        client.queue('set_entity_data', {"runtime_entity_id":"1","metadata":[{"key":"flags","type":"long","value":{"onfire":false,"sneaking":false,"riding":false,"sprinting":false,"action":false,"invisible":false,"tempted":false,"inlove":false,"saddled":false,"powered":false,"ignited":false,"baby":false,"converting":false,"critical":false,"can_show_nametag":false,"always_show_nametag":false,"no_ai":false,"silent":false,"wallclimbing":false,"can_climb":true,"swimmer":false,"can_fly":false,"walker":false,"resting":false,"sitting":false,"angry":false,"interested":false,"charged":false,"tamed":false,"orphaned":false,"leashed":false,"sheared":false,"gliding":false,"elder":false,"moving":false,"breathing":true,"chested":false,"stackable":false,"showbase":false,"rearing":false,"vibrating":false,"idling":false,"evoker_spell":false,"charge_attack":false,"wasd_controlled":false,"can_power_jump":false,"linger":false,"has_collision":true,"affected_by_gravity":true,"fire_immune":false,"dancing":false,"enchanted":false,"show_trident_rope":false,"container_private":false,"transforming":false,"spin_attack":false,"swimming":false,"bribed":false,"pregnant":false,"laying_egg":false,"rider_can_pick":false,"transition_sitting":false,"eating":false,"laying_down":false}}],"tick":"0","properties":{"ints":[],"floats":[]},"links":[]})
        client.queue('set_health', get('set_health'))

        client.queue('chunk_radius_update', { chunk_radius: 32 })
        client.queue('respawn', get('respawn'))

        // Send chunk publisher update
        client.queue('network_chunk_publisher_update', get("network_chunk_publisher_update"))

        // Send all the chunks in the chunk file
        const chunkData = JSON.parse(fs.readFileSync(`./chunkdata/chunks.json`))
        for (const chunkPacket of chunkData) {
          client.queue("level_chunk", chunkPacket)
        }

        // Send all paintings
        // Send all the entities
        for (const painting in serverData.paintings) {
          client.queue("add_painting", serverData.paintings[painting])
        }

        // Send all the entities
        for (const entity in serverData.entities) {
          client.queue("add_entity", serverData.entities[entity])
        }

        // Constantly send this packet to the client to tell it the center position for chunks. The client should then request these
        // missing chunks from the us if it's missing any within the radius. `radius` is in blocks.
        loop = setInterval(() => {
          client.write('network_chunk_publisher_update', get("network_chunk_publisher_update"))
        }, 4500)

        // Wait some time to allow for the client to recieve and load all the chunks
        setTimeout(() => {
          // Allow the client to spawn
          client.write('play_status', { status: 'player_spawn' })
        }, 6000)
      }
    })

    client.on("move_player", (data) => {
      serverData.players[client.profile.uuid].position = {
        coordinates: data.position,
        pitch: data.pitch,
        yaw: data.yaw,
        head_yaw: data.head_yaw,
        on_ground: data.on_ground,
        ridden_runtime_id: data.ridden_runtime_id
      }
    })

    // Handle client subchunk requests
    client.on("subchunk_request", (data) => {
      const subchunkKey = String(data.origin.x) + "_" + String(data.origin.y) + "_" + String(data.origin.z)

      if (Object.keys(serverData.subchunks).includes(subchunkKey)) {
        // Generate subchunk file path and parse its JSON
        const subchunkData = serverData.subchunks[subchunkKey] //JSON.parse(fs.readFileSync("./chunkdata/subchunk_" + String(data.origin.x) + "_" + String(data.origin.y) + "_" + String(data.origin.z) + ".json"))

        // Create skeleton response
        let subchunkPacketData = {
          cache_enabled: subchunkData.cache_enabled,
          dimension: subchunkData.dimension,
          origin: subchunkData.origin,
          entries: []
        }

        // For every requested "subsubchunk", add it to the response if it exists
        for (const request of data.requests) {
          const subSubchunkKey = String(request.dx) + "_" + String(request.dy) + "_" + String(request.dz)

          if (Object.keys(subchunkData.entries).includes(subSubchunkKey)) {
            subchunkPacketData.entries.push(subchunkData.entries[subSubchunkKey])
          } else {
            console.warn(colors.yellow("WARN: Client requested subsubchunk", subSubchunkKey, "but it was not found, falling back to sending all existing subsubchunks!"))

            subchunkPacketData.entries = []

            for (const subchunkEntry in subchunkData.entries) {
              subchunkPacketData.entries.push(subchunkData.entries[subchunkEntry])
            }

            break;
          }
        }

        // Send the response
        client.queue("subchunk", subchunkPacketData)
      } else {
        console.warn(colors.yellow("WARN: Client requested subchunk", subchunkKey, "but it was not found, ignoring request"))
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
        }
      } catch (e) {
        console.error(e)
      }
    })

    client.on('inventory_transaction', (data) => {
      if (data.transaction.transaction_type == "item_use_on_entity") {
        // Get entity data
        entityData = serverData.entities[data.transaction.transaction_data.entity_runtime_id]

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
