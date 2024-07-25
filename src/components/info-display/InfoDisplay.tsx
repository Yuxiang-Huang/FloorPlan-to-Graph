import React, { useContext, useState } from "react";
import GraphInfoDisplay from "./node-info/GraphInfoDisplay";
import { IdEventsContext } from "../contexts/IdEventsProvider";
import { GraphContext } from "../contexts/GraphProvider";
import { getNodeIdSelected, savingHelper } from "../shared/utils";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import { RoomInfo } from "../shared/types";
import { v4 as uuidv4 } from "uuid";
import { RoomsContext } from "../contexts/RoomsProvider";
import RoomInfoDisplay from "./room-info/RoomInfoDisplay";
import { DisplaySettingsContext } from "../contexts/DisplaySettingsProvider";

interface Props {
  floorCode: string;
}

const InfoDisplay = ({ floorCode }: Props) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const setSaveStatus = useContext(SaveStatusContext);
  const { editPolygon, editRoomLabel } = useContext(DisplaySettingsContext);

  const { nodes, setNodes } = useContext(GraphContext);
  const { idSelected } = useContext(IdEventsContext);
  const { rooms, setRooms } = useContext(RoomsContext);
  const nodeId = getNodeIdSelected(idSelected);
  const roomId = nodes[nodeId].roomId;

  if (!roomId) {
    const createRoom = async () => {
      const newRoomId = uuidv4();

      const newRoomInfo: RoomInfo = {
        name: "",
        labelPosition: nodes[nodeId].pos,
        type: "",
        aliases: [],
        polygon: {
          type: "Polygon",
          coordinates: [[]],
        },
      };

      const newRooms = { ...rooms };
      newRooms[newRoomId] = newRoomInfo;
      setRooms(newRooms);

      const newNodes = { ...nodes };
      newNodes[nodeId].roomId = newRoomId;
      setNodes(newNodes);

      savingHelper(
        "/api/updateRoomInfo",
        JSON.stringify({
          floorCode: floorCode,
          roomId: newRoomId,
          newRoomInfo: newRoomInfo,
        }),
        setSaveStatus
      );

      savingHelper(
        "/api/updateGraph",
        JSON.stringify({
          floorCode: floorCode,
          newGraph: JSON.stringify(newNodes),
        }),
        setSaveStatus
      );
    };

    return (
      <button
        className="mr-2 rounded border bg-red-500 p-1 hover:bg-red-700"
        onClick={createRoom}
      >
        Create Room
      </button>
    );
  }

  const renderRoomInfoDisplay = () => <RoomInfoDisplay floorCode={floorCode} />;

  const renderGraphInfoDisplay = () => (
    <GraphInfoDisplay floorCode={floorCode} />
  );

  const tabNames = ["Room Info", "Graph Info"];
  const tabContents = [renderRoomInfoDisplay, renderGraphInfoDisplay];

  return (
    <div className="mx-4 mb-2 w-fit rounded-lg bg-gray-600 px-2 pb-2 text-white shadow-lg">
      <ul className="flex text-sm">
        {tabNames.map((tabName, index) => (
          <button
            key={index}
            className={`mb-3 cursor-pointer border-b-2 px-3 pb-2 pt-4 text-center font-medium ${
              index === activeTabIndex
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-gray-400 hover:border-gray-300 hover:text-white"
            }`}
            onClick={() => {
              if (!editPolygon && !editRoomLabel) {
                setActiveTabIndex(index);
              }
            }}
          >
            {tabName}
          </button>
        ))}
      </ul>
      {tabContents[activeTabIndex]()}
    </div>
  );
};

export default InfoDisplay;
