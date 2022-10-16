#ignorePackets = [
#    "network_chunk_publisher_update,",
#    "level_chunk,",
#    "subchunk_request,",
#]

from yaml import parse


ignorePackets = []

packetValidation = [
    "clientbound",
]

#    "serverbound,move_player,"
#]

#with open("./convertedData.csv", 'w+') as file:
#    file.write("reciptient,name,json\n")

with open("./networkData.csv") as file:
    for line in file:
        line = line.split(",")
        if (line[0] in packetValidation and not line[1] in ignorePackets):
            with open ("./data/" + line[1] + ".json", 'w+') as packetFile:
                parsedLine = ','.join(line[2:])
                parsedLine = parsedLine.replace('""', '"')
                parsedLine = parsedLine[1:-2] # Remove the outermost "s

                packetFile.write(parsedLine)
