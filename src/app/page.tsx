"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { buildingCodeToName } from "../components/shared/buildingCodeToName";
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
        console.log(body);
        return;
      }

      setBuildingCodes(body.result);
    };
    getBuildingCodes();
  }, []);

  return (
    <div>
      <div className="m-2 flex flex-row-reverse text-2xl">
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
            {buildingCodeToName[buildingCode]}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default App;
