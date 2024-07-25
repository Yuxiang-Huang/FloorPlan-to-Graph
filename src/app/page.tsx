"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getBuildingName } from "../components/shared/buildingCodeToName";
import { CiSquarePlus } from "react-icons/ci";

const App: React.FC = () => {
  const [buildingCodes, setBuildingCodes] = useState<string[]>([]);

  useEffect(() => {
    const getBuildingCodes = async () => {
      const response = await fetch("/api/getBuildingCodes", {
        method: "GET",
      });

      const body = await response.json();

      // handle error
      if (!response.ok) {
        console.error(body.error);
        return;
      }

      setBuildingCodes(body.result);
    };
    getBuildingCodes();
  }, []);

  const downloadJsonFiles = async () => {
    const response = await fetch("/api/downloadJsonFiles", {
      method: "GET",
    });

    // Create a temporary anchor element to trigger the download
    const url = window.URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    // Setting filename received in response
    link.setAttribute("download", "JSON Files.zip");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="m-2 flex justify-between text-2xl">
        <button
          className="rounded border border-green-500 p-2 text-sm hover:bg-gray-200"
          onClick={downloadJsonFiles}
        >
          Download JSON Files
        </button>
        <Link href={"PDFUpload"}>
          <CiSquarePlus
            className="text-2xl text-blue-500 hover:text-blue-700"
            size={40}
          />
        </Link>
      </div>

      <div className="m-5 flex flex-wrap gap-8">
        {buildingCodes.map((buildingCode) => (
          <Link
            href={buildingCode}
            key={buildingCode}
            className="cursor-pointer rounded-lg border border-gray-300 p-4 shadow-md transition duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
          >
            {getBuildingName(buildingCode)}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default App;
