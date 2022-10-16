linesToKeep = [
    "clientbound,network_chunk_publisher_update,",
    "clientbound,level_chunk,",
    "serverbound,subchunk_request,",
]
#    "serverbound,move_player,"
#]

with open("./convertedData.csv", 'w+') as file:
    file.write("reciptient,name,json\n")

with open("./networkData.csv") as file:
    for line in file:
        for lineToKeep in linesToKeep:
            if (lineToKeep in line):
                with open("./convertedData.csv", 'a') as otherFile:
                    otherFile.write(line)
                
                continue

