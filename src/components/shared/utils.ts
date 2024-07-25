import { toast } from "react-toastify";
import { IdSelectedInfo } from "../contexts/IdEventsTypes";
import { Failed, Saved, Saving } from "../contexts/SaveStatusType";
import { PDFCoordinate } from "./types";

// geometry
export const distPointToLine = (p1, p2, p3) => {
  const x = p1[0];
  const y = p1[1];
  const x1 = p2[0];
  const y1 = p2[1];
  const x2 = p3[0];
  const y2 = p3[1];

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq != 0)
    //in case of 0 length line
    param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const dist = (p1: PDFCoordinate, p2: PDFCoordinate) => {
  return Number(Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2).toFixed(2));
};

// variable getters
export const getRoomId = (nodes, idSelected: IdSelectedInfo) => {
  const nodeIdSelected = getNodeIdSelected(idSelected);
  return nodeIdSelected ? nodes[nodeIdSelected].roomId : "";
};

export const getNodeIdSelected = (idSelected: IdSelectedInfo) => {
  return idSelected.type == "Node" ? idSelected.id : "";
};

// others
export const setCursor = (e, cursor) => {
  const curStage = e.target.getStage();
  if (curStage != null) {
    const container = curStage.container();
    container.style.cursor = cursor;
  }
};

export const savingHelper = async (apiPath, bodyData, setSaveStatus) => {
  setSaveStatus(Saving);

  // file update
  const response = await fetch(apiPath, {
    method: "POST",
    body: bodyData,
  });

  if (response.ok) {
    setSaveStatus(Saved);
  } else {
    setSaveStatus(Failed);
  }
};

export const addDoorsToGraph = async (floorCode, doorInfos, type, setNodes) => {
  const response = await fetch("/api/addDoorToGraph", {
    method: "POST",
    body: JSON.stringify({
      floorCode: floorCode,
      doorInfos: doorInfos,
      type: type,
    }),
  });
  const body = await response.json();

  // handle error
  if (!response.ok) {
    if (response.status == 500) {
      console.error(body);
      return;
    } else {
      toast.error(body.errorMessage);
      return;
    }
  }

  setNodes(body.nodes);
};
