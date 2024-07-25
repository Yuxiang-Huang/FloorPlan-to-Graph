import React from "react";
import { getBuildingName } from "./shared/buildingCodeToName";
import Link from "next/link";

interface Props {
  buildingCode: string;
}

const NavBar = ({ buildingCode }: Props) => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="flex justify-between">
        <div className="text-xl font-bold text-white">
          CMU Maps Data Visualization
        </div>
        <div className="h-7 -translate-x-1/2 text-xl text-white">
          {getBuildingName(buildingCode)}
        </div>
        <Link
          href={"/"}
          className="mr-2 cursor-pointer text-lg text-white hover:text-gray-400"
        >
          Back
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
