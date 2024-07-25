import { NextResponse } from "next/server";
import { exec } from "child_process"; // switch back to spawn if needed
import { promisify } from "util";
import fs from "fs";
import { readFile } from "fs/promises";
import { ID, Node } from "../../../components/shared/types";
import {
  getBuildingCode,
  getGraphJsonFilePath,
  getOutlineJsonFilePath,
} from "../apiUtils";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const floorCode = requestData.floorCode;
    let walkways = requestData.walkways;
    const density = requestData.density;

    const buildingCode = getBuildingCode(floorCode);

    const outlineFilePath = getOutlineJsonFilePath(floorCode);
    const outlines = JSON.parse(await readFile(outlineFilePath, "utf8"));

    // skip empty polygon rooms
    walkways = walkways.filter(
      (walkway) =>
        outlines["rooms"][walkway].polygon["coordinates"][0].length > 0
    );

    const execPromise = promisify(exec);
    const { stdout, stderr } = await execPromise(
      `python3 public/python/walkway_detection.py ${buildingCode}/${floorCode} ${walkways} ${density}`
    );

    // Python Error Message
    if (stderr) {
      return new NextResponse(
        JSON.stringify({
          error: stderr,
        }),
        {
          status: 500,
        }
      );
    }

    const graphJsonFilePath = getGraphJsonFilePath(floorCode);

    // combine graphs
    const oldGraph = await readFile(graphJsonFilePath, "utf8");
    const oldGraphJSON = JSON.parse(oldGraph);

    const deletedNodeIds: ID[] = [];

    // delete walkways nodes
    for (const nodeId in oldGraphJSON) {
      const curNode: Node = oldGraphJSON[nodeId];

      if (walkways.includes(curNode.roomId)) {
        delete oldGraphJSON[nodeId];
        deletedNodeIds.push(nodeId);
      }
    }

    // delete their neighbors
    for (const nodeId in oldGraphJSON) {
      const curNode: Node = oldGraphJSON[nodeId];

      for (const neighbor in curNode.neighbors) {
        if (deletedNodeIds.includes(neighbor)) {
          delete curNode.neighbors[neighbor];
        }
      }
    }

    const newGraphJSON = JSON.parse(stdout);
    const combinedGraph = { ...oldGraphJSON, ...newGraphJSON };

    fs.writeFileSync(graphJsonFilePath, JSON.stringify(combinedGraph));

    // good response
    return new NextResponse(JSON.stringify({ nodes: combinedGraph }), {
      status: 200,
    });
  } catch (e) {
    // Javascript Error Message
    // console.log(e);
    return new NextResponse(
      JSON.stringify({
        error: String(e),
        // error: String(e.stack),
      }),
      {
        status: 500,
      }
    );
  }
}
