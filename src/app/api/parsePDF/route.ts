import { NextResponse } from "next/server";
import { exec } from "child_process"; // switch back to spawn if needed
import { promisify } from "util";
import fs from "fs";
import { readFile } from "fs/promises";
import {
  getBuildingCode,
  getGraphJsonFilePath,
  getJSONDirPath,
  getOutlineJsonFilePath,
} from "../apiUtils";
import { ALWAYS_REGENERATE } from "../../../API-Settings";
import path from "path";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode = requestData.floorCode;
    const regenerate = requestData.regenerate;

    const buildingCode = getBuildingCode(floorCode);

    // check if can read from already calculated json file
    const jsonFilePath = getOutlineJsonFilePath(floorCode);

    if (!ALWAYS_REGENERATE && !regenerate && fs.existsSync(jsonFilePath)) {
      const data = await readFile(jsonFilePath, "utf8");

      // extra fields to let frontend know how data is retrieved
      const dataJSON = JSON.parse(data);
      dataJSON["calculated"] = true;
      delete dataJSON.floorCodeDNE;

      return new NextResponse(
        JSON.stringify({
          result: dataJSON,
        }),
        {
          status: 200,
        }
      );
    }

    // spawn a Python process to parse the pdf
    const execPromise = promisify(exec);
    const { stdout: stdout, stderr: stderr } = await execPromise(
      `python3 public/python/parse_pdf.py ${buildingCode}/${floorCode}.pdf`,
      { maxBuffer: 1024 * 2024 * 5 } // 5 MB
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

    const parsedJSON = JSON.parse(stdout);

    // create json directory if it doesn't exist
    const dir = path.join(process.cwd(), "public", "json");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    // create floor json directory if it doesn't exist
    const floorDir = getJSONDirPath(buildingCode);
    if (!fs.existsSync(floorDir)) {
      fs.mkdirSync(floorDir);
    }

    // write graph to -graph.json
    const graph = parsedJSON.graph;
    fs.writeFileSync(getGraphJsonFilePath(floorCode), JSON.stringify(graph));

    // write output without graph to .json
    delete parsedJSON.graph;
    fs.writeFileSync(jsonFilePath, JSON.stringify(parsedJSON));

    // good response
    return new NextResponse(
      JSON.stringify({
        result: parsedJSON,
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
