import json


def check_json(jsonName):
    f = open("public/json/" + jsonName, encoding="utf8")
    output = json.load(f)

    for room in output["rooms"]:
        if room["type"] == "":
            print(room["name"] + " doesn't have a type!")


check_json("GHC-5.json")
