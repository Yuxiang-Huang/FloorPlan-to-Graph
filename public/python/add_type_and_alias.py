import json


# return true if the file name do not exist as a floor name in Nicolas-export.json
def add_type_and_alias(allRooms, floorName):
    f = open("public/json/Nicolas-export.json", encoding="utf8")
    data = json.load(f)

    for room in allRooms.values():
        room["type"] = ""
        room["aliases"] = []

    if floorName not in data["floors"]:
        return True

    roomList = data["floors"][floorName]["rooms"]
    roomName_to_typeAndAliases = dict()
    for room in roomList:
        roomName_to_typeAndAliases[room["name"]] = dict()
        roomName_to_typeAndAliases[room["name"]]["type"] = room["type"]
        roomName_to_typeAndAliases[room["name"]]["aliases"] = []
        if "alias" in room and room["alias"] != "":
            roomName_to_typeAndAliases[room["name"]]["aliases"].append(room["alias"])

    for room in allRooms.values():
        if room["name"] in roomName_to_typeAndAliases:
            typeAndAlias = roomName_to_typeAndAliases[room["name"]]
            if "type" in typeAndAlias:
                room["type"] = typeAndAlias["type"]
            if "aliases" in typeAndAlias:
                room["aliases"] = typeAndAlias["aliases"]

    return False
