import sys
import json


def getOutlineData():
    f = open("tmp/json/" + sys.argv[1] + "-outline.json", encoding="utf8")
    return json.load(f)
