import React, { useContext } from "react";
import { OutlineContext } from "../contexts/OutlineProvider";
import { GraphContext } from "../contexts/GraphProvider";
import { LoadingContext } from "../contexts/LoadingProvider";
import { addDoorsToGraph, dist, savingHelper } from "../shared/utils";
import {
  setModeAddDoorNode,
  setModeAddNode,
} from "../shared/keyboardShortcuts";
import { ModeContext } from "../contexts/ModeProvider";
import NodeSizeSlider from "./SizeSlider";
import { renderSidePanelButton } from "../shared/displayUtils";
import {
  AsEdge,
  AsNode,
} from "../../app/api/addDoorToGraph/addDoorToGraphTypes";
import { NodeSizeContext } from "../contexts/NodeSizeProvider";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import { useRouter } from "next/navigation";
import { IdEventsContext } from "../contexts/IdEventsProvider";
import { DefaultIdSelected } from "../contexts/IdEventsTypes";

interface Props {
  floorCode: string;
}

const GraphTab = ({ floorCode }: Props) => {
  const router = useRouter();
  const { setMode } = useContext(ModeContext);
  const { doors, setDoors, setRoomlessDoors } = useContext(OutlineContext);
  const { nodes, setNodes } = useContext(GraphContext);
  const { setLoadingText } = useContext(LoadingContext);
  const { nodeSize } = useContext(NodeSizeContext);
  const setSaveStatus = useContext(SaveStatusContext);
  const { setIdSelected } = useContext(IdEventsContext);

  const removeOverlappingsNodes = () => {
    const nodeIds = Object.keys(nodes);

    const newNodes = { ...nodes };

    const nodeIdsRemoved: string[] = [];

    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];
      const p1 = nodes[nodeId].pos;
      for (const j of nodeIds.slice(i + 1)) {
        if (dist(p1, nodes[j].pos) < nodeSize * 2) {
          // connect the two neighbor nodes if possible
          if (Object.values(newNodes[nodeId].neighbors).length == 2) {
            const neighbors = Object.keys(newNodes[nodeId].neighbors);
            const node0 = newNodes[neighbors[0]];
            const node1 = newNodes[neighbors[1]];

            // make sure both neighbors are not deleted already
            if (node0 && node1) {
              const curDist = dist(node0.pos, node1.pos);
              node0.neighbors[neighbors[1]] = { dist: curDist };
              node1.neighbors[neighbors[0]] = { dist: curDist };
            }
          }
          delete newNodes[nodeId];
          nodeIdsRemoved.push(nodeId);
          break;
        }
      }
    }

    // remove neighbors
    for (const node of Object.values(nodes)) {
      for (const removedNodeId of nodeIdsRemoved) {
        delete node.neighbors[removedNodeId];
      }
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
  };

  const relinkDoorsAndRooms = async () => {
    setLoadingText("Relinking rooms and doors");

    const result = await fetch("/api/relinkRoomsAndDoors", {
      method: "POST",
      body: JSON.stringify({
        floorCode: floorCode,
      }),
    });

    const body = await result.json();

    if (!result.ok) {
      console.error(body);
      return;
    }

    setDoors(body.doors);
    setRoomlessDoors(body.roomlessDoors);

    router.push(floorCode);
    setIdSelected(DefaultIdSelected);
    setLoadingText("");
  };

  // used for addDoorToGraph api
  const doorInfos = Object.values(doors).filter(
    (door) => door.roomIds.length == 2
  );

  return (
    <div className="ml-2 mr-2 space-y-4">
      <div className="space-x-2">
        {renderSidePanelButton("Add Node", () => setModeAddNode(setMode))}
        {renderSidePanelButton("Add Door Node", () =>
          setModeAddDoorNode(setMode)
        )}
      </div>

      <div className="flex">
        <p className="py-1">Doors are</p>
        {renderSidePanelButton(
          "Nodes!",
          () => addDoorsToGraph(floorCode, doorInfos, AsNode, setNodes),
          "ml-2 px-2 py-1 border"
        )}
        {renderSidePanelButton(
          "Edges!",
          () => addDoorsToGraph(floorCode, doorInfos, AsEdge, setNodes),
          "ml-2 px-2 py-1 border"
        )}
      </div>

      <div>
        {renderSidePanelButton("Relink Rooms and Doors", relinkDoorsAndRooms)}
      </div>

      <div>
        {renderSidePanelButton(
          "Remove Overlapping Nodes",
          removeOverlappingsNodes
        )}
      </div>

      <NodeSizeSlider text="Node" />
    </div>
  );
};

export default GraphTab;
