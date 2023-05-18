from tqdm import tqdm
import json

fileName = "./proxyOutput/proxyLog - 14-05-2023, 22-29-55.log"
outputFilename = './plugins/legends/sequences/sequence-event.json'
filter = ["play_sound", "set_title", "level_sound_event", "move_entity", "move_entity_delta", "animate_entity", "set_entity_data", "mod_effect", "update_attributes", "update_block", "set_entity_motion", "sync_entity_property", "item_component"]
timestampStart = 648983 # Do not use packets before this time
timestampEnd = 0 # use 0 for no end

# Timestamp ranges:
# 648983-0 - whole* event lol
# 2679 - 2731 - startup special packets

outputBuffer = []
lastTimestamp = 0

with open(fileName, 'r', encoding='utf8') as file:
    for line in tqdm(file, desc="Reading [" + fileName + "]"):
        if (line == "time,receiptient,name,json\n"):
            continue # Skip headers

        splitLine = line.split(",")
        if (len(splitLine) < 3):
            continue
        if (splitLine[1] != 'clientbound'):
            continue
        if (int(splitLine[0]) < timestampStart):
            continue
        if (timestampEnd != 0 and int(splitLine[0]) > timestampEnd):
            break

        if (splitLine[2] in filter): # Handle packet
            if (lastTimestamp == 0):
                lastTimestamp = int(splitLine[0])

            packetData = json.loads(','.join(splitLine[3:]).replace('""', '"')[1:-2])

            if (splitLine[2] == "set_entity_data"):
                for metadataItem in packetData["metadata"]:
                    if (metadataItem["type"] == "long"):
                        if (type(metadataItem["value"]) == dict):
                            del metadataItem["value"]["_value"]
            
            outputBuffer.append([int(splitLine[0]) - lastTimestamp, splitLine[2], packetData])

            lastTimestamp = int(splitLine[0])



with open(outputFilename, 'w', encoding='utf8') as file:
    file.write(json.dumps(outputBuffer, indent=2))


