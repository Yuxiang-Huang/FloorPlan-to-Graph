import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const fileName = requestData.fileName;
    const file = requestData.file;

    const PDFDirectory = path.join(process.cwd(), "public", "pdf");

    // create pdf dir if it doesn't exist
    if (!fs.existsSync(PDFDirectory)) {
      fs.mkdirSync(PDFDirectory);
    }

    const FloorPlanPDFDirectory = path.join(
      process.cwd(),
      "public",
      "pdf",
      fileName.split("-")[0]
    );

    // create floor pdf directory if it doesn't exist
    if (!fs.existsSync(FloorPlanPDFDirectory)) {
      fs.mkdirSync(FloorPlanPDFDirectory);
    }

    const filePath = path.join(FloorPlanPDFDirectory, fileName);

    const uint8Array = Buffer.from(file, "base64");

    fs.writeFile(filePath, uint8Array, (err) => {
      if (err) {
        console.error("Error creating file:", err);
        return;
      }

      console.log("File created successfully:", filePath);
    });

    // Send a response with the file path
    return new NextResponse(
      JSON.stringify({
        status: 200,
      })
    );
  } catch (error) {
    console.log(error);
    return new NextResponse(
      JSON.stringify({
        error: "Error saving file",
      }),
      {
        status: 500,
      }
    );
  }
}
