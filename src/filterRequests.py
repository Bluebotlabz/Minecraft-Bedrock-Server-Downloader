from tqdm import tqdm

fileName = "./proxyOutput/proxyLog - 14-05-2023, 22-29-55.log"

filter = ["play_sound", "set_title", "level_sound_event", "move_entity", "add_entity", "move_entity_delta"]


outputBuffer = []

with open('./filteredProxylog.log', 'w', encoding='utf8') as file:
    file.write('time,receiptient,name,json')

with open(fileName, 'r', encoding='utf8') as file:
    for line in tqdm(file, desc="Reading [" + fileName + "]"):
        if (line == "time,receiptient,name,json\n"):
            continue # Skip headers

        splitLine = line.split(",")
        if (len(splitLine) < 3):
            continue
        if (splitLine[2] in filter): # Handle chunk packet
            outputBuffer.append(line)

        if (len(outputBuffer) >= 500):
            with open('./filteredProxylog.log', 'a', encoding='utf8') as file:
                for line in outputBuffer:
                    file.write(line)
                outputBuffer = []
        

