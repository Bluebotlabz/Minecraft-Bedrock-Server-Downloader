import shutil
import json
import os

legacySubchunkFolder = "./subchunks/"
optimizedSubchunkFolder = "./optimizedSubchunks/"

try:
    os.mkdir(optimizedSubchunkFolder)
except:
    pass

for subchunkFileName in os.listdir(legacySubchunkFolder):
    with open(legacySubchunkFolder + subchunkFileName) as subchunkFile:
        subchunkData = json.loads(subchunkFile.read())

        print("==========")
        print("coords: " + str(subchunkData["origin"]))

        optimizedSubchunkFileName = '_'.join([ str(subchunkData["origin"]["x"]), str(subchunkData["origin"]["y"]), str(subchunkData["origin"]["z"]) ]) + ".json"
        try:
            with open("./optimizedSubchunks/" + optimizedSubchunkFileName, 'r+' ) as optimizedSubchunkFile:
                print("Reading from file")
                
                optimizedSubchunkData = json.load(optimizedSubchunkFile)
                
                optimizedSubchunkData["entries"] += subchunkData["entries"]

                # Go to start of file and remove all contents:
                optimizedSubchunkFile.seek(0)
                optimizedSubchunkFile.truncate(0)

                # Overwrite file
                optimizedSubchunkFile.write(json.dumps(optimizedSubchunkData))

        except FileNotFoundError:
            with open("./optimizedSubchunks/" + optimizedSubchunkFileName, 'w' ) as optimizedSubchunkFile:
                optimizedSubchunkData = subchunkData.copy()
                optimizedSubchunkData["entries"] = []
                
                optimizedSubchunkData["entries"] += subchunkData["entries"]

                #print(optimizedSubchunkData)
                optimizedSubchunkFile.write(json.dumps(optimizedSubchunkData))