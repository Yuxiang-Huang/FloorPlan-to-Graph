import { NextResponse } from "next/server";
import fs from "fs/promises";
import { getPDFDirPath } from "../apiUtils";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingCode = searchParams.get("buildingCode");

    if (!buildingCode) {
      return new NextResponse(
        JSON.stringify({
          error: "Need Building Code!",
        }),
        {
          status: 500,
        }
      );
    }

    const pdfFolderPath = getPDFDirPath();

    const folders = await fs.readdir(path.join(pdfFolderPath, buildingCode));

    return new NextResponse(
      JSON.stringify({
        result: folders.filter((name) => name != ".DS_Store"),
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
