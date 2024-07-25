import React, { useContext } from "react";
import { RED_BUTTON_STYLE } from "../../shared/displayUtils";
import {
  deleteNode,
  setModeAddEdge,
  setModeDeleteEdge,
} from "../../shared/keyboardShortcuts";
import { ModeContext } from "../../contexts/ModeProvider";
import { IdEventsContext } from "../../contexts/IdEventsProvider";
import { GraphContext } from "../../contexts/GraphProvider";
import { SaveStatusContext } from "../../contexts/SaveStatusProvider";
import { getNodeIdSelected } from "../../shared/utils";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface Props {
  floorCode: string;
}

const GraphInfoButtons = ({ floorCode }: Props) => {
  const router = useRouter();

  const setSaveStatus = useContext(SaveStatusContext);

  const { setMode } = useContext(ModeContext);
  const { idSelected, setIdSelected } = useContext(IdEventsContext);

  const { nodes, setNodes } = useContext(GraphContext);

  const nodeId = getNodeIdSelected(idSelected);

  const renderButton = (text, handleClick, style?) => {
    return (
      <div>
        <button
          className={twMerge(
            "mb-2 rounded bg-slate-500 px-2 py-1 text-sm text-white hover:bg-slate-700",
            style
          )}
          onClick={handleClick}
        >
          {text}
        </button>
      </div>
    );
  };

  const renderCopyNodeIdButton = () => {
    const copyId = () => {
      navigator.clipboard.writeText(nodeId);
      toast.success("Copied!");
    };

    return renderButton("Copy Node ID", copyId);
  };

  const renderDeleteNodeButton = () => {
    const deleteNodeHelper = () =>
      deleteNode(
        nodes,
        nodeId,
        setNodes,
        floorCode,
        setMode,
        setSaveStatus,
        setIdSelected,
        router
      );

    return renderButton("Delete Node", deleteNodeHelper, RED_BUTTON_STYLE);
  };

  const renderAddEdgeByClickingButton = () => {
    const addEdge = () => setModeAddEdge(setMode);
    return renderButton("Add Edge", addEdge);
  };

  const renderDeleteEdgeButton = () => {
    const deleteEdge = () => setModeDeleteEdge;
    return renderButton("Delete Edge", deleteEdge);
  };

  return (
    <div>
      <div className="flex space-x-4">
        {renderCopyNodeIdButton()}
        {renderDeleteNodeButton()}
      </div>
      <div className="flex space-x-4">
        {renderAddEdgeByClickingButton()}
        {renderDeleteEdgeButton()}
      </div>
    </div>
  );
};

export default GraphInfoButtons;
