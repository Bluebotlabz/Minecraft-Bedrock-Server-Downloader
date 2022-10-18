import json
import os

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

                optimizedSubchunkFileName = '_'.join(( str(subchunkData["origin"]["x"]), str(subchunkData["origin"]["y"]), str(subchunkData["origin"]["z"]) )) + ".json"
                try:
                    with open(outputDir + optimizedSubchunkFileName, 'r+' ) as optimizedSubchunkFile:
                        optimizedSubchunkData = json.load(optimizedSubchunkFile)
                        
                        #optimizedSubchunkData["entries"] += subchunkData["entries"]
                        for entry in subchunkData["entries"]:
                            optimizedSubchunkData["entries"]['_'.join( (str(entry["dx"]), str(entry["dy"]), str(entry["dz"])) )] = entry

                        # Go to start of file and remove all contents:
                        optimizedSubchunkFile.seek(0)
                        optimizedSubchunkFile.truncate(0)

                        # Overwrite file
                        optimizedSubchunkFile.write(json.dumps(optimizedSubchunkData))

                except FileNotFoundError:
                    with open(outputDir + optimizedSubchunkFileName, 'w' ) as optimizedSubchunkFile:
                        #optimizedSubchunkData = subchunkData.copy()
                        #optimizedSubchunkData["entries"] = []
                        
                        optimizedSubchunkData = subchunkData.copy()

                        optimizedSubchunkData["entries"] = {}

                        for entry in subchunkData["entries"]:
                            optimizedSubchunkData["entries"]['_'.join( (str(entry["dx"]), str(entry["dy"]), str(entry["dz"])) )] = entry

                        #print(optimizedSubchunkData)
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

def dumpAttributes(csvFile, exportFolder):
    try:
        os.mkdir(exportFolder)
    except:
        pass

    with open(csvFile) as file:
        for line in file:
            line = line.split(",")
            if (line[1] == "update_attributes"):
                attributeData = json.loads(','.join(line[2:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
                attributeData["runtime_entity_id"] = "1"

                with open(exportFolder + "/update_attributes.json", 'w+') as newUpdateAttributes:
                    newUpdateAttributes.write(json.dumps(attributeData))
                
                return

def dumpStartGame(csvFile, exportFolder):
    try:
        os.mkdir(exportFolder)
    except:
        pass

    with open(csvFile) as file:
        for line in file:
            line = line.split(",")
            if (line[1] == "start_game"):
                startGameData = json.loads(','.join(line[2:]).replace('""', '"')[1:-2]) # Combine list JSON and remove the outermost "s and trailing \n (also unescapes CSV "s)
                startGameData["runtime_entity_id"] = "1"

                with open(exportFolder + "/start_game.json", 'w+') as newStartGame:
                    newStartGame.write(json.dumps(startGameData))

                return

print("Converting generic packets")
splitRequests("./networkData.csv", "./data/", "clientbound", ["level_chunk", "subchunk", "add_entity", "add_painting", "npc_dialogue"])

print("Converting player attributes")
dumpAttributes("./networkData.csv", "./data/")

print("Converting start game packet")
dumpStartGame("./networkData.csv", "./data/")

print("Converting chunk packets")
splitRequestsToJSON("./networkData.csv", "./chunks/", ["clientbound"], ["level_chunk"])

print("Converting subchunk packets")
subchunkDumper("./networkData.csv", "./subchunks/")

print("Converting entity packets")
splitRequestsToJSON("./networkData.csv", "./entities/", ["clientbound"], ["add_entity"])

print("Converting painting packets")
splitRequestsToJSON("./networkData.csv", "./paintings/", ["clientbound"], ["add_painting"])

print("Converting npc dialogue packets")
splitRequestsToJSON("./networkData.csv", "./npc_dialogue/", ["clientbound"], ["npc_dialogue"])

print("\n\nCSV Packets Converted To JSON Successfully")