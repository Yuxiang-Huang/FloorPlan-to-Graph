export const buildingCodeToName = {
  AN: "Ansys Hall",
  BH: "Baker Hall",
  CFA: "College of Fine Arts",
  CUC: "Cohon University Center",
  DH: "Doherty Hall",
  GHC: "Gates & Hillman Centers",
  HBH: "Hamburg Hall",
  HH: "Hamerschlag Hall",
  HL: "Hunt Library",
  HOA: "Hall of the Arts",
  MI: "Mellon Institute",
  MM: "Margaret Morrison Carnegie Hall",
  NSH: "Newell-Simon Hall",
  PC: "Posner Center",
  PCA: "Purnell Center for the Arts",
  PH: "Porter Hall",
  POS: "Posner Hall",
  SC: "Scott Hall",
  SH: "Scaife Hall",
  TCS: "TCS Hall",
  TEP: "Tepper Building",
  WEH: "Wean Hall",

  outside: "Campus Outside",

  MGE: "E-Tower",
};

export const getBuildingName = (buildingCode: string) => {
  if (buildingCodeToName[buildingCode]) {
    return buildingCodeToName[buildingCode];
  } else {
    return buildingCode;
  }
};
