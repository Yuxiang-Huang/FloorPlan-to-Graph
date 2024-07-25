import { NextResponse } from "next/server";
import { exec } from "child_process"; // switch back to spawn if needed
import { promisify } from "util";
import fs from "fs";
import { readFile } from "fs/promises";
import { getBuildingCode, getOutlineJsonFilePath } from "../apiUtils";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode = requestData.floorCode;

    const buildingCode = getBuildingCode(floorCode);

    const execPromise = promisify(exec);
    const { stdout, stderr } = await execPromise(
      `python3 public/python/relink_rooms_and_doors.py ${buildingCode}/${floorCode}`
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

    const newDoors = JSON.parse(stdout);

    const jsonFilePath = getOutlineJsonFilePath(floorCode);

    const floorData = await readFile(jsonFilePath, "utf8");
    const floorDataJSON = JSON.parse(floorData);

    floorDataJSON["doors"] = newDoors["doors"];
    floorDataJSON["roomlessDoors"] = newDoors["roomlessDoors"];

    fs.writeFileSync(jsonFilePath, JSON.stringify(floorDataJSON));

    // good response
    return new NextResponse(
      JSON.stringify({
        doors: newDoors["doors"],
        roomlessDoors: newDoors["roomlessDoors"],
      }),
      {
        status: 200,
      }
    );
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
