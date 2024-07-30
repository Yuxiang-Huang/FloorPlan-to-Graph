import React, { useContext, useState } from "react";

import { Stage, Layer, Line, Circle, Path, Rect, Group } from "react-konva";
import {
  DoorInfo,
  EdgeTypeList,
  ID,
  Node,
  PDFCoordinate,
  RoomInfo,
} from "../shared/types";
import { VisibilitySettingsContext } from "../contexts/VisibilitySettingsProvider";
import { OutlineContext } from "../contexts/OutlineProvider";
import { GraphContext } from "../contexts/GraphProvider";
import { RoomsContext } from "../contexts/RoomsProvider";
import {
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  ModeContext,
  GRAPH_SELECT,
  POLYGON_ADD_VERTEX,
  POLYGON_SELECT,
  ADD_DOOR_NODE,
} from "../contexts/ModeProvider";
import { toast } from "react-toastify";
import {
  addDoorsToGraph,
  dist,
  distPointToLine,
  getNodeIdSelected,
  getRoomId,
  savingHelper,
  setCursor,
} from "../shared/utils";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import { booleanPointInPolygon } from "@turf/turf";

import { v4 as uuidv4 } from "uuid";
import PolygonEditor from "./PolygonEditor";
import { Polygon } from "geojson";
import { saveToPolygonHistory, saveToRooms } from "../shared/polygonUtils";
import { PolygonContext } from "../contexts/PolygonProvider";
import { IdEventsContext } from "../contexts/IdEventsProvider";
import { NodeSizeContext } from "../contexts/NodeSizeProvider";
import { DOOR, NODE } from "../contexts/IdEventsTypes";
import { AsNode } from "../../app/api/addDoorToGraph/addDoorToGraphTypes";
import { DisplaySettingsContext } from "../contexts/DisplaySettingsProvider";
import { TfiLocationPin } from "react-icons/tfi";
import { useRouter } from "next/navigation";

interface Props {
  floorCode: string;
  setCanPan: (canPan: boolean) => void;
  handleWheel;
  handleDragMove;
  scale;
  offset;
  stageRef;
}

const findRoomId = (rooms: Record<string, RoomInfo>, point: PDFCoordinate) => {
  let resRoomId = "";

  for (const roomId in rooms) {
    const polygon = rooms[roomId].polygon;

    if (polygon) {
      if (polygon.coordinates[0].length == 0) {
        continue;
      }

      if (booleanPointInPolygon([point.x, point.y], polygon)) {
        resRoomId = roomId;
      }
    }
  }
  return resRoomId;
};

const adjustPosition = (pos, offset, scale) => {
  return {
    x: Number(((pos.x - offset.x) / scale).toFixed(2)),
    y: Number(((pos.y - offset.y) / scale).toFixed(2)),
  };
};

const FloorDisplay = ({
  floorCode,
  setCanPan,
  handleWheel,
  handleDragMove,
  scale,
  offset,
  stageRef,
}: Props) => {
  const router = useRouter();

  const { showOutline, showNodes, showEdges, showLabels } = useContext(
    VisibilitySettingsContext
  );
  const { width, height, walls, doors, roomlessDoors } =
    useContext(OutlineContext);
  const { rooms, setRooms } = useContext(RoomsContext);
  const { nodes, setNodes } = useContext(GraphContext);

  const { showRoomSpecific, setShowRoomSpecific, editRoomLabel } = useContext(
    DisplaySettingsContext
  );
  const { mode, setMode } = useContext(ModeContext);
  const setSaveStatus = useContext(SaveStatusContext);
  const { history, setHistory, historyIndex, setHistoryIndex, coordsIndex } =
    useContext(PolygonContext);
  const { idSelected, nodeIdHovered } = useContext(IdEventsContext);
  const { nodeSize } = useContext(NodeSizeContext);

  const [nodeIdOnDrag, setNodeIdOnDrag] = useState<ID>("");

  const roomIdSelected = getRoomId(nodes, idSelected);
  const { editPolygon } = useContext(DisplaySettingsContext);

  const addDoorNodeErrToast = () => {
    toast.error("Click on a purple door to add a door node!");
  };

  const drawWalls = () =>
    walls.map((points: number[], index: number) => (
      <Line key={index} points={points} stroke="black" strokeWidth={1} />
    ));

  const drawDoors = () => {
    const handleDoorClick = (doorId: ID) => {
      if (!editPolygon) {
        if (mode == ADD_DOOR_NODE) {
          addDoorsToGraph(floorCode, [doors[doorId]], AsNode, setNodes);
          setMode(GRAPH_SELECT);
        } else {
          router.push(`${floorCode}?doorId=${doorId}`);
        }
      }
    };

    const getStrokeColor = (doorId: ID) => {
      if (
        (idSelected.type == DOOR && doorId == idSelected.id) ||
        (idSelected.type == NODE &&
          doors[doorId].roomIds.includes(nodes[idSelected.id].roomId))
      ) {
        return "silver";
      }

      if (doors[doorId].roomIds.length != 2) {
        return "red";
      }

      return "purple";
    };

    return Object.entries(doors).map(([doorId, doorInfo]: [ID, DoorInfo]) =>
      doorInfo.lineList.map((points, index: number) => (
        // identify bezier curve by number of points
        <Line
          key={doorId + " " + index}
          points={points}
          stroke={getStrokeColor(doorId)}
          strokeWidth={2.5}
          bezier={points.length == 8}
          onMouseEnter={(e) => setCursor(e, "pointer")}
          onMouseLeave={(e) => setCursor(e, "default")}
          onClick={() => {
            handleDoorClick(doorId);
          }}
        />
      ))
    );
  };

  const drawRoomlessDoors = () => {
    return roomlessDoors.map((points, index) => (
      <Line
        key={index}
        points={points}
        stroke={"black"}
        strokeWidth={1}
        bezier={points.length == 8}
      />
    ));
  };

  const drawNodes = () => {
    const getFillColor = (nodeId: ID) => {
      const nodeIdSelected = getNodeIdSelected(idSelected);
      if (nodeId == nodeIdSelected) {
        return "yellow";
      }

      if (nodeId == nodeIdHovered) {
        return "cyan";
      }

      const hasAcrossFloorEdge =
        Object.values(nodes[nodeId].neighbors).filter(
          (neighbor) => neighbor.toFloorInfo
        ).length != 0;

      const isRoomAcrossFloorType =
        nodes[nodeId].roomId &&
        EdgeTypeList.includes(rooms[nodes[nodeId].roomId].type);

      if (isRoomAcrossFloorType) {
        if (hasAcrossFloorEdge) {
          return "lime";
        } else {
          return "pink";
        }
      } else {
        if (hasAcrossFloorEdge) {
          return "pink";
        }
      }

      if (
        !nodes[nodeId].roomId ||
        rooms[nodes[nodeId].roomId].polygon.coordinates[0].length == 0
      ) {
        return "red";
      }

      if (rooms[nodes[nodeId].roomId].type == "inaccessible") {
        return "gray";
      }

      return "blue";
    };

    const handleNodeClick = (nodeId: ID) => {
      if (mode == GRAPH_SELECT) {
        router.push(`${floorCode}?nodeId=${nodeId}`);
      } else if (mode == ADD_EDGE) {
        if (idSelected.type != NODE) {
          console.error(
            "No way a node is not selected in add edge mode, right?"
          );
        }

        const nodeIdSelected = getNodeIdSelected(idSelected);
        if (nodeIdSelected == nodeId) {
          toast.error("No self edge allowed!");
        }

        const addEdge = (nodeId, neighborID, newNodes) => {
          if (Object.keys(newNodes[nodeId].neighbors).includes(neighborID)) {
            toast.error("Edge already existed!");
            return false;
          }

          const newNode = JSON.parse(JSON.stringify(newNodes[nodeId]));

          newNode.neighbors[neighborID] = {
            dist: dist(newNodes[nodeId].pos, newNodes[neighborID].pos),
          };

          newNodes[nodeId] = newNode;

          return true;
        };

        const newNodes = { ...nodes };

        if (addEdge(nodeId, nodeIdSelected, newNodes)) {
          addEdge(nodeIdSelected, nodeId, newNodes);
        }

        setNodes(newNodes);

        savingHelper(
          "/api/updateGraph",
          JSON.stringify({
            floorCode: floorCode,
            newGraph: JSON.stringify(newNodes),
          }),
          setSaveStatus
        );

        setMode(GRAPH_SELECT);
      } else if (mode == DELETE_EDGE) {
        if (idSelected.type != NODE) {
          console.error(
            "No way a node is not selected in delete edge mode, right?"
          );
        }

        const nodeIdSelected = getNodeIdSelected(idSelected);

        if (!Object.keys(nodes[nodeId].neighbors).includes(nodeIdSelected)) {
          toast.error("No edge exist between these two nodes!");
          return;
        }

        const newNodes = { ...nodes };
        const newNode = JSON.parse(JSON.stringify(newNodes[nodeIdSelected]));

        delete newNodes[nodeId].neighbors[nodeIdSelected];

        delete newNode.neighbors[nodeId];
        newNodes[nodeIdSelected] = newNode;

        setNodes(newNodes);

        savingHelper(
          "/api/updateGraph",
          JSON.stringify({
            floorCode: floorCode,
            newGraph: JSON.stringify(newNodes),
          }),
          setSaveStatus
        );

        setMode(GRAPH_SELECT);
      } else if (mode == ADD_DOOR_NODE) {
        addDoorNodeErrToast();
      }
    };

    const handleOnDragEnd = (e, nodeId) => {
      setNodeIdOnDrag("");

      const newNodes = { ...nodes };
      const newNode = JSON.parse(JSON.stringify(newNodes[nodeId]));

      newNode.pos = {
        x: Number(e.target.x().toFixed(2)),
        y: Number(e.target.y().toFixed(2)),
      };

      newNode.roomId = findRoomId(rooms, newNode.pos);

      for (const neighborId in newNode.neighbors) {
        // don't modify distance for edge across floors
        if (!newNode.neighbors[neighborId].toFloorInfo) {
          const newDist = dist(newNode.pos, newNodes[neighborId].pos);
          newNode.neighbors[neighborId] = { dist: newDist };
          newNodes[neighborId].neighbors[nodeId] = { dist: newDist };
        }
      }

      newNodes[nodeId] = newNode;
      setNodes(newNodes);

      savingHelper(
        "/api/updateGraph",
        JSON.stringify({
          floorCode: floorCode,
          newGraph: JSON.stringify(newNodes),
        }),
        setSaveStatus
      );
    };

    return Object.entries(nodes).map(
      ([nodeId, node]: [ID, Node], index: number) => {
        if (!showRoomSpecific || node.roomId == roomIdSelected) {
          return (
            <Circle
              key={index}
              x={node.pos.x}
              y={node.pos.y}
              radius={nodeSize}
              fill={getFillColor(nodeId)}
              stroke="black"
              strokeWidth={1}
              onMouseEnter={(e) => setCursor(e, "pointer")}
              onMouseLeave={(e) => setCursor(e, "default")}
              onClick={() => handleNodeClick(nodeId)}
              draggable
              onDragStart={() => setNodeIdOnDrag(nodeId)}
              onDragEnd={(e) => handleOnDragEnd(e, nodeId)}
            />
          );
        }
      }
    );
  };

  const drawEdges = () => {
    const includedNodes = new Set();
    const edges: [number[], string][] = [];

    const getStrokeColor = (curID: ID, neighborID: ID) => {
      const nodeIdSelected = getNodeIdSelected(idSelected);
      if (curID == nodeIdSelected || neighborID == nodeIdSelected) {
        return "orange";
      }

      return "green";
    };

    for (const curID in nodes) {
      for (const neighborID in nodes[curID].neighbors) {
        // don't display an edge twice and don't display edge of a node on drag
        if (
          !includedNodes.has(neighborID) &&
          nodeIdOnDrag != curID &&
          nodeIdOnDrag != neighborID
        ) {
          // don't display edge that connect to a different floor
          if (nodes[neighborID]) {
            // logic for displaying room specific edges
            if (!showRoomSpecific || nodes[curID].roomId == roomIdSelected) {
              edges.push([
                [
                  nodes[curID].pos.x,
                  nodes[curID].pos.y,
                  nodes[neighborID].pos.x,
                  nodes[neighborID].pos.y,
                ],
                getStrokeColor(curID, neighborID),
              ]);
            }
          }
        }
      }
      includedNodes.add(curID);
    }

    return edges.map(([points, color], index: number) => {
      return (
        <Line key={index} points={points} stroke={color} strokeWidth={1} />
      );
    });
  };

  const drawLabels = () => {
    const path = TfiLocationPin({}).props.children[1].props.d;
    const viewBox = TfiLocationPin({}).props.attr.viewBox.split(" ");
    const width = Number(viewBox[2]);
    const height = Number(viewBox[3]);

    return Object.entries(rooms).map(([roomId, roomInfo]) => {
      // selected if it is edit label mode and it is the label of the selected room
      // or the room of the label is connected by the selected door
      const selected =
        (editRoomLabel && roomIdSelected == roomId) ||
        (idSelected.type == DOOR &&
          doors[idSelected.id].roomIds.includes(roomId));

      // show label if in show all lables mode or "selected" (see above)
      if (showLabels || selected) {
        const draggable = editRoomLabel && roomIdSelected == roomId;

        const handleOnDragEnd = (e) => {
          const newRoomInfo: RoomInfo = {
            ...rooms[roomId],
            labelPosition: {
              x: (e.target.x() + width / 2).toFixed(2),
              y: (e.target.y() + height).toFixed(2),
            },
          };
          const newRooms = Object.assign(rooms, {});
          newRooms[roomId] = newRoomInfo;
          setRooms(newRooms);
          savingHelper(
            "/api/updateRoomInfo",
            JSON.stringify({
              floorCode: floorCode,
              roomId: roomId,
              newRoomInfo: newRoomInfo,
            }),
            setSaveStatus
          );
        };

        return (
          <Group
            x={roomInfo.labelPosition.x - width / 2}
            y={roomInfo.labelPosition.y - height}
            key={roomId}
            draggable={draggable}
            onDragEnd={(e) => handleOnDragEnd(e)}
          >
            <Path fill={selected ? "orange" : "indigo"} data={path} />
            {draggable && (
              <Rect width={Number(width)} height={Number(height)} />
            )}
          </Group>
        );
      }
    });
  };

  const renderPolygonEditor = () => {
    const polygon = rooms[roomIdSelected].polygon;

    if (!polygon) {
      return;
    }

    if (!editPolygon) {
      return polygon.coordinates.map((coords, index) => (
        <Line
          key={index}
          points={coords.flat()}
          stroke="orange"
          strokeWidth={3}
        />
      ));
    }

    return (
      polygon && (
        <PolygonEditor
          floorCode={floorCode}
          roomId={roomIdSelected}
          polygon={polygon}
          nodeSize={nodeSize}
        />
      )
    );
  };

  const handleStageClick = (e) => {
    const clickedOnStage = e.target == e.target.getStage();

    // errors for each mode relative to stage clicking
    if (mode == ADD_NODE || mode == POLYGON_ADD_VERTEX) {
      if (!clickedOnStage) {
        toast.error("Click on empty space!");
        return;
      }
    } else if (mode == ADD_DOOR_NODE) {
      if (clickedOnStage) addDoorNodeErrToast();
    } else if (mode == ADD_EDGE || mode == DELETE_EDGE) {
      if (clickedOnStage) {
        toast.error("Click on another node!");
        return;
      }
    }

    if (mode == ADD_NODE) {
      const pos = e.target.getPointerPosition();
      const newNode: Node = {
        pos: adjustPosition(pos, offset, scale),
        neighbors: {},
        roomId: findRoomId(rooms, adjustPosition(pos, offset, scale)),
      };

      const newNodes = { ...nodes };
      newNodes[uuidv4()] = newNode;

      setNodes(newNodes);

      savingHelper(
        "/api/updateGraph",
        JSON.stringify({
          floorCode: floorCode,
          newGraph: JSON.stringify(newNodes),
        }),
        setSaveStatus
      );

      setMode(GRAPH_SELECT);
    } else if (mode == POLYGON_ADD_VERTEX) {
      const pos = adjustPosition(e.target.getPointerPosition(), offset, scale);
      const newVertex = [Number(pos.x.toFixed(2)), Number(pos.y.toFixed(2))];

      const polygon = rooms[roomIdSelected].polygon;

      const coords = polygon.coordinates[coordsIndex];

      const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));

      if (coords.length == 0) {
        // first and last coordinate need to be the same
        newPolygon.coordinates[coordsIndex].push(newVertex);
        newPolygon.coordinates[coordsIndex].push(newVertex);
      } else {
        let minDist = distPointToLine(newVertex, coords[0], coords[1]);
        let indexToInsert = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          const curDist = distPointToLine(newVertex, coords[i], coords[i + 1]);
          if (curDist < minDist) {
            indexToInsert = i;
            minDist = curDist;
          }
        }

        newPolygon.coordinates[coordsIndex].splice(
          indexToInsert + 1,
          0,
          newVertex
        );
      }

      saveToPolygonHistory(
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
        newPolygon
      );
      saveToRooms(
        floorCode,
        roomIdSelected,
        rooms,
        setRooms,
        newPolygon,
        setSaveStatus
      );

      setMode(POLYGON_SELECT);
    } else if (e.target === e.target.getStage()) {
      if (!editPolygon && !editRoomLabel) {
        router.push(floorCode);
        setShowRoomSpecific(false);
      }
    }
  };

  return (
    <>
      <Stage
        width={width}
        height={height}
        onMouseDown={(e) => setCanPan(e.target === e.target.getStage())}
        onMouseUp={() => setCanPan(true)}
        onClick={(e) => handleStageClick(e)}
        draggable
        onWheel={handleWheel}
        onDragMove={handleDragMove}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        ref={stageRef}
      >
        <Layer>
          {showOutline && drawWalls()}
          {showOutline && drawDoors()}
          {showOutline && drawRoomlessDoors()}

          {roomIdSelected && renderPolygonEditor()}

          {showNodes && !editPolygon && !editRoomLabel && drawNodes()}
          {showEdges && !editPolygon && !editRoomLabel && drawEdges()}
          {drawLabels()}
        </Layer>
      </Stage>
    </>
  );
};

export default FloorDisplay;
