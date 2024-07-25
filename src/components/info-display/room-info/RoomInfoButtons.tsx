import React, { useCallback, useContext, useEffect, useState } from "react";
import { PolygonContext } from "../../contexts/PolygonProvider";
import { ShortcutsStatusContext } from "../../contexts/ShortcutsStatusProvider";
import { LoadingContext } from "../../contexts/LoadingProvider";
import { DisplaySettingsContext } from "../../contexts/DisplaySettingsProvider";
import {
  GRAPH_SELECT,
  ModeContext,
  POLYGON_SELECT,
} from "../../contexts/ModeProvider";
import { RoomsContext } from "../../contexts/RoomsProvider";
import { GraphContext } from "../../contexts/GraphProvider";
import { IdEventsContext } from "../../contexts/IdEventsProvider";
import { getRoomId } from "../../shared/utils";
import ToggleSwitch from "../../common/ToggleSwitch";
import { DEFAULT_DENSITY } from "../../../app/api/detectWalkway/detectWalkway";
import { WalkwayTypeList } from "../../shared/types";
import { useRouter } from "next/navigation";
import { DefaultIdSelected } from "../../contexts/IdEventsTypes";

interface Props {
  floorCode: string;
}

const RoomInfoTable = ({ floorCode }: Props) => {
  const router = useRouter();

  const { shortcutsDisabled } = useContext(ShortcutsStatusContext);
  const { setLoadingText } = useContext(LoadingContext);

  const { showRoomSpecific, setShowRoomSpecific, editRoomLabel } = useContext(
    DisplaySettingsContext
  );

  const { setMode } = useContext(ModeContext);

  const { editPolygon, setEditPolygon, setEditRoomLabel } = useContext(
    DisplaySettingsContext
  );

  const { rooms } = useContext(RoomsContext);
  const { nodes, setNodes } = useContext(GraphContext);
  const { idSelected, setIdSelected } = useContext(IdEventsContext);

  const roomId = getRoomId(nodes, idSelected);
  const room = rooms[roomId];

  const { setHistory, setCoordsIndex } = useContext(PolygonContext);

  const handleEditPolygonModeClick = useCallback(() => {
    const curPolygon = rooms[roomId].polygon;

    if (editPolygon) {
      setEditPolygon(false);
      setMode(GRAPH_SELECT);
    } else {
      setEditPolygon(true);
      setMode(POLYGON_SELECT);
      setHistory([curPolygon]);
      setCoordsIndex(0);
    }
  }, [
    editPolygon,
    roomId,
    rooms,
    setCoordsIndex,
    setEditPolygon,
    setHistory,
    setMode,
  ]);

  useEffect(() => {
    if (shortcutsDisabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "p") {
        handleEditPolygonModeClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleEditPolygonModeClick, shortcutsDisabled]);

  const renderSetEditPolygonButton = () => {
    return (
      <td className="text-center">
        <button
          className="my-2 w-28 rounded bg-slate-500 px-4 py-1 text-sm text-white hover:bg-slate-700"
          onClick={handleEditPolygonModeClick}
        >
          {editPolygon ? "Finish Editing" : "Edit Room Polygon"}
        </button>
      </td>
    );
  };

  const renderSetEditLabelButton = () => {
    return (
      <td className="text-center">
        <button
          className="my-2 w-28 rounded bg-slate-500 px-4 py-1 text-sm text-white hover:bg-slate-700"
          onClick={() => setEditRoomLabel(!editRoomLabel)}
        >
          {editRoomLabel ? "Finish Editing" : "Edit Room Label"}
        </button>
      </td>
    );
  };

  const renderRoomSpecificToggle = () => {
    return (
      <tr>
        <td colSpan={2}>
          <div className="flex items-center justify-center py-2 text-right">
            <ToggleSwitch
              isOn={showRoomSpecific}
              handleToggle={() => setShowRoomSpecific(!showRoomSpecific)}
            />
            <p className="ml-2 text-sm">Show Room Specific Graph</p>
          </div>
        </td>
      </tr>
    );
  };

  const RenderDetectWalkwayRow = () => {
    const [density, setDensity] = useState<number>(DEFAULT_DENSITY);

    if (editPolygon) {
      return;
    }

    const detectWalkway = async () => {
      const walkway = [roomId];

      setLoadingText("Detect Walkway");

      const walkwayResult = await fetch("/api/detectWalkway", {
        method: "POST",
        body: JSON.stringify({
          floorCode: floorCode,
          walkways: walkway,
          density: density,
        }),
      });

      const walkwayBody = await walkwayResult.json();

      if (!walkwayResult.ok) {
        console.log(walkwayBody);
        return;
      }

      setNodes(walkwayBody.nodes);

      setIdSelected(DefaultIdSelected);
      router.push(floorCode);
      setLoadingText("");
    };

    if (WalkwayTypeList.includes(room.type)) {
      return (
        <tr>
          <td className="text-center">
            <button
              className="my-2 w-28 rounded bg-slate-500 px-4 py-1 text-sm text-white hover:bg-slate-700"
              onClick={detectWalkway}
            >
              Detect Walkway
            </button>
          </td>
          <td>
            <div className="flex justify-center">
              <div className="w-24">
                <input
                  type="range"
                  min="0.25"
                  max="2"
                  step=".25"
                  value={density}
                  onChange={(e) => setDensity(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer rounded-lg bg-blue-400"
                />
                <div className="text-center text-sm">Density: {density}</div>
              </div>
            </div>
          </td>
        </tr>
      );
    }
  };
  return (
    <>
      <tr>
        {renderSetEditPolygonButton()}
        {renderSetEditLabelButton()}
      </tr>
      {renderRoomSpecificToggle()}
      {RenderDetectWalkwayRow()}
    </>
  );
};

export default RoomInfoTable;
