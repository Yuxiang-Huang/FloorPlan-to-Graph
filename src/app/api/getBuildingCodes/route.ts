import { NextResponse } from "next/server";
import fs from "fs/promises";
import { getPDFDirPath } from "../apiUtils";

export async function GET() {
  try {
    const pdfFolderPath = getPDFDirPath();

    const folders = await fs.readdir(pdfFolderPath);

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
