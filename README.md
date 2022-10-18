# Minecraft-Bedrock-Server-Downloader
Play on Minecraft Servers... Even When They're Offline!

CONTENTS:
- [What is it?](#what-is-it)
- [Installation](#installation)
- [How does it work?](#how-does-it-work)
- [TODO](#todo)

## What is it?
Originally designed to allow players to play on the Official Minecraft Mob Vote server even after it was closed, the Minecraft Bedrock Server Downloader allows any player to easily download the packets sent between a server and their client via its proxy.
After that, these packets can then be [converted](./network-to-world/) into a JSON format which can then be used by the server to host a copy of the original server's world

## Installation
1. Clone the repo and install the dependencies
~~~bash
git clone https://github.com/Bluebotlaboratories/Minecraft-Bedrock-Server-Downloader.git
cd Minecraft-Bedrock-Server-Downloader
npm i
~~~
2. Start the proxy server
~~~bash
npm proxy
~~~
2a. Convert the files
[TBA]<br/>
3. Start the main server
~~~bash
npm start
~~~

## How does it work?
1. Start up the proxy server configured to your target server
2. Connect to the proxy server
3. Do stuff, move around
4. Disconnect and close the proxy server
5. [Convert](./network-to-world/) the files to the correct format
6. Launch the main server
7. Connect to the main server
8. Enjoy!

## TODO
- [x] Replace subchunk packets with custom subchunk format
- [x] Integrate packet conversion directly into proxy
- [ ] Fix NPCs
- [ ] Fix inventory packets
- [ ] Fix interaction packets
- [ ] Fix sound packets
- [ ] Implement basic plugin support (maybe?)
- [ ] Add redstone (maybe?)
