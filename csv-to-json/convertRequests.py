import json
import os



def chunkDumper(csvFile, outputDir):
    try:
        os.mkdir(outputDir)
    except:
        pass

    with open(csvFile) as file:
        optimizedChunkData = []

        for line in file:
            line = line.split(",")
            if (line[1] == "level_chunk"):
                chunkData = json.loads(','.join(line[2:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
                
                optimizedChunkData.append(chunkData)

        with open(outputDir + "/chunks.json", 'w' ) as optimizedChunkFile:
            # Write file
            optimizedChunkFile.write(json.dumps(optimizedChunkData))

def entityDumper(csvFile, packetIndex, packetName, outputFile):
    with open(csvFile) as file:
        for line in file:
            line = line.split(",")
            if (line[1] == packetName):
                packetData = json.loads(','.join(line[2:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)

                try:
                    with open(outputFile, 'r+') as file:
                        savedData = json.load(file)

                        savedData[packetData[packetIndex]] = packetData
                        
                        # Go to start of file and remove all contents:
                        file.seek(0)
                        file.truncate(0)

                        # Overwrite file
                        file.write(json.dumps(savedData))
                except:
                    with open(outputFile, 'w') as file:
                        savedData = {
                            packetData[packetIndex]: packetData
                        }

                        # Write file
                        file.write(json.dumps(savedData))

def subchunkDumper(csvFile, outputDir):
    try:
        os.mkdir(outputDir)
    except:
        pass

    with open(csvFile) as file:
        for line in file:
            line = line.split(",")
            if (line[1] == "subchunk"):
                subchunkData = json.loads(','.join(line[2:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)

                optimizedSubchunkFileName = "subchunk_" + '_'.join(( str(subchunkData["origin"]["x"]), str(subchunkData["origin"]["y"]), str(subchunkData["origin"]["z"]) )) + ".json"
                try:
                    with open(outputDir + optimizedSubchunkFileName, 'r+' ) as optimizedSubchunkFile:
                        optimizedSubchunkData = json.load(optimizedSubchunkFile)
                        
                        for entry in subchunkData["entries"]:
                            optimizedSubchunkData["entries"]['_'.join( (str(entry["dx"]), str(entry["dy"]), str(entry["dz"])) )] = entry

                        # Go to start of file and remove all contents:
                        optimizedSubchunkFile.seek(0)
                        optimizedSubchunkFile.truncate(0)

                        # Overwrite file
                        optimizedSubchunkFile.write(json.dumps(optimizedSubchunkData))

                except FileNotFoundError:
                    with open(outputDir + optimizedSubchunkFileName, 'w' ) as optimizedSubchunkFile:                        
                        optimizedSubchunkData = subchunkData.copy()

                        optimizedSubchunkData["entries"] = {}

                        for entry in subchunkData["entries"]:
                            optimizedSubchunkData["entries"]['_'.join( (str(entry["dx"]), str(entry["dy"]), str(entry["dz"])) )] = entry

                        optimizedSubchunkFile.write(json.dumps(optimizedSubchunkData))

def splitRequests(csvFile, outputDir, filterBound, ignorePackets = []):
    try:
        os.mkdir(outputDir)
    except:
        pass

    requestsSaved = []
    with open(csvFile) as file:
        for line in file:
            line = line.split(",")
            if (line[0] == filterBound and not line[1] in ignorePackets and not line[1] in requestsSaved):
                with open (outputDir + line[1] + ".json", 'w+') as packetFile:
                    parsedLine = ','.join(line[2:])
                    parsedLine = parsedLine.replace('""', '"')
                    parsedLine = parsedLine[1:-2] # Remove the outermost "s and trailing \n

                    packetFile.write(parsedLine)
                    requestsSaved.append(line[1])

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
                    parsedLine = parsedLine[1:-2] # Remove the outermost "s and trailing \n

                    packetFile.write(parsedLine)

                    packetIndex += 1

def convertPacketEntityID(csvFile, packetName, exportFolder):
    try:
        os.mkdir(exportFolder)
    except:
        pass

    with open(csvFile) as file:
        for line in file:
            line = line.split(",")
            if (line[1] == packetName):
                attributeData = json.loads(','.join(line[2:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
                attributeData["runtime_entity_id"] = "1"

                with open(exportFolder + "/" + packetName + ".json", 'w') as newUpdateAttributes:
                    newUpdateAttributes.write(json.dumps(attributeData))
                
                return

print("Converting generic packets")
splitRequests("./networkData.csv", "./data/", "clientbound", ["level_chunk", "subchunk", "add_entity", "add_painting", "npc_dialogue"])

print("Converting player attributes")
convertPacketEntityID("./networkData.csv", "update_attributes", "./data/")

print("Converting start game packet")
convertPacketEntityID("./networkData.csv", "start_game", "./data/")

print("Converting chunk packets")
chunkDumper("./networkData.csv", "./chunkdata/")

print("Converting subchunk packets")
subchunkDumper("./networkData.csv", "./chunkdata/")

print("Converting entity packets")
entityDumper("./networkData.csv", "runtime_id", "add_entity", "./data/entities.json")

print("Converting painting packets")
entityDumper("./networkData.csv", "runtime_entity_id", "add_painting", "./data/paintings.json")

print("Converting npc dialogue packets")
splitRequestsToJSON("./networkData.csv", "./npc_dialogue/", ["clientbound"], ["npc_dialogue"])

print("\n\nCSV Packets Converted To JSON Successfully")