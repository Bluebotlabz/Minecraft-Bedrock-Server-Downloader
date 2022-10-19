const Long = require('long');

module.exports = function (server, serverData) {
  console.log("Vanilla Commands plugin loaded")

    server.on('connect', client => {
        client.on('command_request', (data) => {
            commandData = data.command.split(' ')
      
            try {
              switch (commandData[0]) {
                case "/stop": // Stops the server
                  client.disconnect("The Server Has Stopped")
                  client.close()
                  exit()
                case "/gamemode":
                  console.log(data.origin)
                  //client.queue(commandData[1], JSON.parse(commandData.slice(2, commandData.length).join(' ')))
                  client.queue("update_player_game_type", {"gamemode":"creative","player_unique_id":"-236223166499"})
                  client.queue("command_output", {"origin":{"type":"player","uuid":data.origin.uuid,"request_id":""},"output_type":"all","success_count":1,"output":[{"success":true,"message_id":"commands.gamemode.success.self","parameters":["%createWorldScreen.gameMode.creative"]}]})
                  break
              }
            } catch (e) {
              console.error(e)
            }
        })
    })
}