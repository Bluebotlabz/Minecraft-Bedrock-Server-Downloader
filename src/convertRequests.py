from tqdm import tqdm
import json
import os

fileName = "./proxyOutput/combinedLog.log"



os.makedirs("./chunkdata", exist_ok=True)
os.makedirs("./data", exist_ok=True)
os.makedirs("./entities", exist_ok=True)
os.makedirs("./paintings", exist_ok=True)


chunkData = {}
subchunkData = {}
genericJSON = {}
npcDialogue = []
entities = {}
paintings = {}

with open(fileName, 'r', encoding='utf8') as file:
    for line in tqdm(file, desc="Reading [" + fileName + "]"):
        if (line == "time,receiptient,name,json\n"):
            continue # Skip headers

        line = line.split(",")
        if (line[2] == "level_chunk"): # Handle chunk packet
            chunkPacketData = json.loads(','.join(line[3:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
            chunkData[str(chunkPacketData['x']) + '_' + str(chunkPacketData['z'])] = chunkPacketData
        elif (line[2] == "subchunk"): # Handle sub+subsub chunks
            subchunkPacketData = json.loads(','.join(line[3:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
            stringifiedSubchunkCoords = str(subchunkPacketData["origin"]["x"]) + '_' + str(subchunkPacketData["origin"]["y"]) + '_' + str(subchunkPacketData["origin"]["z"])

            if (stringifiedSubchunkCoords in list(subchunkData.keys())):
                for entry in subchunkPacketData["entries"]:
                    subchunkData[stringifiedSubchunkCoords]["entries"]['_'.join( (str(entry["dx"]), str(entry["dy"]), str(entry["dz"])) )] = entry
            else:
                subchunkData[stringifiedSubchunkCoords] = subchunkPacketData

                subchunkData[stringifiedSubchunkCoords]["entries"] = {}

                for entry in subchunkPacketData["entries"]:
                    subchunkData[stringifiedSubchunkCoords]["entries"]['_'.join( (str(entry["dx"]), str(entry["dy"]), str(entry["dz"])) )] = entry
        elif (line[2] == "start_game"):
            genericJSON["start_game"] = json.loads(','.join(line[3:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
            genericJSON["start_game"]["runtime_entity_id"] = "1"
        elif (line[2] == "update_attributes"):
            genericJSON["update_attributes"] = json.loads(','.join(line[3:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
            genericJSON["update_attributes"]["runtime_entity_id"] = "1"
        elif (line[2] == "add_entity"): # Handle adding entities
            packetData = json.loads(','.join(line[3:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)

            if (not "properties" in packetData.keys()):
                packetData["properties"] = {"ints":[],"floats":[]}
            
            if (not "links" in packetData.keys()):
                packetData["links"] = []

            entities[str(packetData["runtime_id"])] = packetData
        elif (line[2] == "add_painting"): # Handle adding entities
            packetData = json.loads(','.join(line[3:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)

            if (not "properties" in packetData.keys()):
                packetData["properties"] = {"ints":[],"floats":[]}
            
            if (not "links" in packetData.keys()):
                packetData["links"] = []

            paintings[str(packetData["runtime_id"])] = packetData
        elif (line[1] == "npc_dialogue" and line[0] == "clientbound"): # Handle NPC_DIALOGUE
            npcDialogue.append(json.loads(','.join(line[2:]).replace('""', '"')[1:-2])) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
        else:
            try:
                genericJSON[line[2]] = json.loads(','.join(line[3:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
            except:
                print("ERROR CONVERTING PACKET: [" + line[2] + "]")
# Write files
flatChunks = []
for chunkName in list(chunkData.keys()):
    flatChunks.append(chunkData[chunkName])

with open('./chunkdata/chunks.json', 'w') as file:
    file.write(json.dumps(flatChunks))

for subchunkKey in list(subchunkData.keys()):
    with open('./chunkdata/' + 'subchunk_' + subchunkKey + '.json', 'w') as file:
        file.write(json.dumps(subchunkData[subchunkKey]))

for genericKey in list(genericJSON.keys()):
    with open('./data/' + genericKey + '.json', 'w') as file:
        file.write(json.dumps(genericJSON[genericKey]))

for entityKey in list(entities.keys()):
    with open('./entities/' + 'entity_' + entityKey + '.json', 'w') as file:
        file.write(json.dumps(entities[entityKey]))

for paintingKey in list(paintings.keys()):
    with open('./paintings/' + 'painting_' + paintingKey + '.json', 'w') as file:
        file.write(json.dumps(paintings[paintingKey]))

npcIndex = 0
for npcDialoguePacket in npcDialogue:
    with open('./npc_dialogue/' + npcIndex + '.json', 'w') as file:
        file.write(json.dumps(npcDialoguePacket))