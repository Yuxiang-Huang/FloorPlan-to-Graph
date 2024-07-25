import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import fs from "fs";
import { getPDFDirPath } from "../apiUtils";

export async function GET() {
  try {
    const pdfFolderPath = getPDFDirPath();

    // create pdf dir if it doesn't exist
    if (!fs.existsSync(pdfFolderPath)) {
      fs.mkdirSync(pdfFolderPath);
    }

    const folders = await readdir(pdfFolderPath);

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
