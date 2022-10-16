import os

def splitRequestsToJSON(csvFile, exportFolder, boundedness, packetType):

    try:
        os.mkdir(exportFolder)
    except:
        pass

    packetIndex = 0
    with open(csvFile) as file:
        for line in file:
            line = line.split(",")
            if (line[0] in boundedness and line[1] in packetType):
                with open (exportFolder + "/" + line[1] + "-" + str(packetIndex) + ".json", 'w+') as packetFile:
                    parsedLine = ','.join(line[2:])
                    parsedLine = parsedLine.replace('""', '"')
                    parsedLine = parsedLine[1:-2] # Remove the outermost "s

                    packetFile.write(parsedLine)

                    packetIndex += 1

splitRequestsToJSON("./networkData.csv", "./chunks/", ["clientbound"], ["level_chunk"])
splitRequestsToJSON("./networkData.csv", "./subchunks/", ["clientbound"], ["subchunk"])
splitRequestsToJSON("./networkData.csv", "./entities/", ["clientbound"], ["add_entity"])
splitRequestsToJSON("./networkData.csv", "./paintings/", ["clientbound"], ["add_painting"])
splitRequestsToJSON("./networkData.csv", "./npc_dialogue/", ["clientbound"], ["npc_dialogue"])