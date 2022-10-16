#ignorePackets = [
#    "network_chunk_publisher_update,",
#    "level_chunk,",
#    "subchunk_request,",
#]



packetTypeValidation = [
    "level_chunk"
]

packetValidation = [
    "clientbound",
]

#    "serverbound,move_player,"
#]

#with open("./convertedData.csv", 'w+') as file:
#    file.write("reciptient,name,json\n")

chunkIndex = 0

with open("./networkData.csv") as file:
    for line in file:
        line = line.split(",")
        if (line[0] in packetValidation and line[1] in packetTypeValidation):
            with open ("./chunks/" + line[1] + "-" + str(chunkIndex) + ".json", 'w+') as packetFile:
                parsedLine = ','.join(line[2:])
                parsedLine = parsedLine.replace('""', '"')
                parsedLine = parsedLine[1:-2] # Remove the outermost "s

                packetFile.write(parsedLine)

                chunkIndex += 1


### SUBCHUNKS
packetTypeValidation = [
    "subchunk"
]

packetValidation = [
    "clientbound",
]

#    "serverbound,move_player,"
#]

#with open("./convertedData.csv", 'w+') as file:
#    file.write("reciptient,name,json\n")

chunkIndex = 0

with open("./networkData.csv") as file:
    for line in file:
        line = line.split(",")
        if (line[0] in packetValidation and line[1] in packetTypeValidation):
            with open ("./subchunks/" + line[1] + "-" + str(chunkIndex) + ".json", 'w+') as packetFile:
                parsedLine = ','.join(line[2:])
                parsedLine = parsedLine.replace('""', '"')
                parsedLine = parsedLine[1:-2] # Remove the outermost "s

                packetFile.write(parsedLine)

                chunkIndex += 1