import path from "path";

export const getBuildingCode = (floorCode) => {
  return floorCode.split("-")[0];
};

export const getJSONDirPath = (buildingCode) => {
  return path.join(process.cwd(), "public", "json", buildingCode);
};

export const getOutlineJsonFilePath = (floorCode) => {
  return path.join(
    process.cwd(),
    "public",
    "json",
    getBuildingCode(floorCode),
    floorCode + "-outline.json"
  );
};

export const getGraphJsonFilePath = (floorCode) => {
  return path.join(
    process.cwd(),
    "public",
    "json",
    getBuildingCode(floorCode),
    floorCode + "-graph.json"
  );
};

export const getPDFDirPath = () => {
  return path.join(process.cwd(), "public", "pdf");
};
