import { NextResponse } from "next/server";
import { exec } from "child_process"; // switch back to spawn if needed
import { promisify } from "util";
import { getBuildingCode } from "../apiUtils";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode = requestData.floorCode;
    const roomId = requestData.roomId;

    const buildingCode = getBuildingCode(floorCode);

    const execPromise = promisify(exec);
    const { stdout, stderr } = await execPromise(
      `python3 public/python/simplify_polygon.py ${buildingCode}/${floorCode} ${roomId}`
    );

    // Python Error Message
    if (stderr) {
      return new NextResponse(
        JSON.stringify({
          python_stderr_error: stderr,
        }),
        {
          status: 500,
        }
      );
    }

    // good response
    return new NextResponse(
      JSON.stringify({ newPolygon: JSON.parse(stdout) }),
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
