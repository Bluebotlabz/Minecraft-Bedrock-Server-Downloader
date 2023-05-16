from tqdm import tqdm
import json

fileName = "./proxyOutput/proxyLog - 14-05-2023, 22-29-55.log"
filter = ["play_sound", "set_title", "level_sound_event", "move_entity", "move_entity_delta"]
timestampStart = 648983 # Do not use packets before this time

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

        if (splitLine[2] in filter): # Handle packet
            if (lastTimestamp == 0):
                lastTimestamp = int(splitLine[0])
            
            outputBuffer.append([int(splitLine[0]) - lastTimestamp, splitLine[2], json.loads(','.join(splitLine[3:]).replace('""', '"')[1:-2])])

            lastTimestamp = int(splitLine[0])



with open('./sequence.json', 'w', encoding='utf8') as file:
    file.write(json.dumps(outputBuffer))


