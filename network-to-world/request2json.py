import os

try:
    os.mkdir("./data/")
except:
    pass

ignorePackets = []

packetValidation = [
    "clientbound",
]

requestsSaved = []

with open("./networkData.csv") as file:
    for line in file:
        line = line.split(",")
        if (line[0] in packetValidation and not line[1] in ignorePackets and not line[1] in requestsSaved):
            with open ("./data/" + line[1] + ".json", 'w+') as packetFile:
                parsedLine = ','.join(line[2:])
                parsedLine = parsedLine.replace('""', '"')
                parsedLine = parsedLine[1:-2] # Remove the outermost "s

                packetFile.write(parsedLine)
                requestsSaved.append(line[1])
