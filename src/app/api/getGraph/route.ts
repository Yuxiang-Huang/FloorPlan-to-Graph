import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getGraphJsonFilePath } from "../apiUtils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const floorCode = searchParams.get("floorCode");

    if (!floorCode) {
      return new NextResponse(
        JSON.stringify({
          error: "Need Floor Code!",
        }),
        {
          status: 500,
        }
      );
    }

    // check if can read from already calculated json file
    const jsonFilePath = getGraphJsonFilePath(floorCode);

    const graph = await readFile(jsonFilePath, "utf8");

    return new NextResponse(
      JSON.stringify({
        result: JSON.parse(graph),
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
