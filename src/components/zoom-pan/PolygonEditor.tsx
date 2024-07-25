import { Polygon } from "geojson";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Circle, Line } from "react-konva";
import { ID } from "../shared/types";
import { RoomsContext } from "../contexts/RoomsProvider";
import { setCursor } from "../shared/utils";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import { toast } from "react-toastify";
import {
  ModeContext,
  POLYGON_DELETE_VERTEX,
  POLYGON_SELECT,
} from "../contexts/ModeProvider";
import {
  setModePolygonAddVertex,
  setModePolygonDeleteVertex,
} from "../shared/keyboardShortcuts";
import { saveToPolygonHistory, saveToRooms } from "../shared/polygonUtils";
import { PolygonContext } from "../contexts/PolygonProvider";
import { ShortcutsStatusContext } from "../contexts/ShortcutsStatusProvider";

interface Props {
  floorCode: string;
  roomId: ID;
  polygon: Polygon;
  nodeSize: number;
}

const PolygonEditor = ({ floorCode, roomId, polygon, nodeSize }: Props) => {
  const { shortcutsDisabled } = useContext(ShortcutsStatusContext);

  const { mode, setMode } = useContext(ModeContext);
  const { rooms, setRooms } = useContext(RoomsContext);
  const setSaveStatus = useContext(SaveStatusContext);
  const { history, setHistory, historyIndex, setHistoryIndex, coordsIndex } =
    useContext(PolygonContext);

  const [vertexOnDrag, setVertexOnDrag] = useState<number>(-1);

  const saveNewPolygonEdit = (newPolygon: Polygon) => {
    saveToPolygonHistory(
      history,
      setHistory,
      historyIndex,
      setHistoryIndex,
      newPolygon
    );
    saveToRoomsHelper(newPolygon);
  };

  const saveToRoomsHelper = useCallback(
    (newPolygon: Polygon) => {
      saveToRooms(
        floorCode,
        roomId,
        rooms,
        setRooms,
        newPolygon,
        setSaveStatus
      );
    },
    [floorCode, roomId, rooms, setRooms, setSaveStatus]
  );

  useEffect(() => {
    if (shortcutsDisabled) {
      return;
    }

    const undo = () => {
      if (historyIndex == 0) {
        toast.error("Can't undo anymore!");
        return;
      }

      saveToRoomsHelper(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
    };

    const redo = () => {
      if (historyIndex == history.length - 1) {
        toast.error("Can't redo anymore!");
        return;
      }

      saveToRoomsHelper(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (event.key === "d") {
        setModePolygonDeleteVertex(setMode);
      } else if (event.key === "v") {
        setModePolygonAddVertex(setMode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    history,
    historyIndex,
    saveToRoomsHelper,
    setHistoryIndex,
    setMode,
    shortcutsDisabled,
  ]);

  const handleOnDragEnd = (e, index: number) => {
    const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));
    const coords = newPolygon.coordinates[coordsIndex];
    const newPos = [
      Number(e.target.x().toFixed(2)),
      Number(e.target.y().toFixed(2)),
    ];
    coords[index] = newPos;
    // first and last point need to stay the same
    if (index == 0) {
      coords[coords.length - 1] = newPos;
    }

    saveNewPolygonEdit(newPolygon);
  };

  const handleClick = (index: number) => {
    if (mode == POLYGON_DELETE_VERTEX) {
      const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));
      const coords = newPolygon.coordinates[coordsIndex];
      coords.splice(index, 1);

      // when deleting the first index
      if (index == 0) {
        // keep the start and end the same if there are more vertices
        if (coords.length != 1) {
          coords.push(coords[0]);
        }
        // delete the duplicate vertex if there is no more vertex
        else {
          coords.pop();
        }
      }

      saveNewPolygonEdit(newPolygon);
      setMode(POLYGON_SELECT);
    }
  };

  const renderLines = () => {
    const coords = polygon.coordinates[coordsIndex];
    let prev = coords[0];

    const lines: unknown[] = [];

    // skip the first point and point on drag
    coords.map((points, index) => {
      if (
        !(
          index == 0 ||
          index == vertexOnDrag ||
          (index + coords.length - 1) % coords.length == vertexOnDrag ||
          // special case of dragging the last coord
          (vertexOnDrag == 0 && index == coords.length - 1)
        )
      ) {
        lines.push(
          <Line
            key={index}
            points={[...prev, ...points]}
            stroke="orange"
            strokeWidth={3}
          />
        );
      }
      prev = points;
    });

    return lines.map((line) => line);
  };

  return (
    <>
      {renderLines()}
      {/* first and last point are the same */}
      {polygon.coordinates[coordsIndex].map(
        (point, index) =>
          index !== polygon.coordinates[coordsIndex].length - 1 && (
            <Circle
              key={index}
              x={point[0]}
              y={point[1]}
              radius={nodeSize}
              fill="cyan"
              stroke="black"
              draggable
              onMouseEnter={(e) => setCursor(e, "pointer")}
              onMouseLeave={(e) => setCursor(e, "default")}
              onDragStart={() => setVertexOnDrag(index)}
              onDragEnd={(e) => {
                handleOnDragEnd(e, index);
                setVertexOnDrag(-1);
              }}
              onClick={() => handleClick(index)}
            />
          )
      )}
    </>
  );
};

export default PolygonEditor;
