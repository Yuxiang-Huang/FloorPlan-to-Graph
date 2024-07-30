import React, { useContext } from "react";
import ToggleSwitch from "../common/ToggleSwitch";
import { VisibilitySettingsContext } from "../contexts/VisibilitySettingsProvider";
import {
  RED_BUTTON_STYLE,
  renderSidePanelButton,
} from "../shared/displayUtils";
import { DisplaySettingsContext } from "../contexts/DisplaySettingsProvider";
import { useRouter } from "next/navigation";

const SHOW_REGENERATE_BUTTON = false;

interface Props {
  floorCode: string;
  parsePDF: (regnerate: boolean) => void;
}

const VisibilityTab = ({ floorCode, parsePDF }: Props) => {
  const router = useRouter();

  const { editPolygon } = useContext(DisplaySettingsContext);

  const {
    showFile,
    setShowFile,
    showOutline,
    setShowOutline,
    showNodes,
    setShowNodes,
    showEdges,
    setShowEdges,
    showLabels,
    setShowLabels,
  } = useContext(VisibilitySettingsContext);

  const renderToggle = (
    text: string,
    isOn: boolean,
    handleToggle: () => void
  ) => {
    return (
      <div className="flex text-nowrap">
        <p className="mr-3 mt-1">{text}</p>
        <ToggleSwitch isOn={isOn} handleToggle={handleToggle} />
      </div>
    );
  };

  const handleRegenerate = () => {
    if (
      confirm("Are you sure you want to regnerate the graph for this floor?")
    ) {
      router.push(floorCode);
      parsePDF(true);
    }
  };

  return (
    <div className="ml-3 mr-2 mt-1 space-y-5">
      {renderToggle("Show File", showFile, () => setShowFile(!showFile))}
      {renderToggle("Show Outline", showOutline, () =>
        setShowOutline(!showOutline)
      )}
      {renderToggle("Show Nodes", showNodes, () => setShowNodes(!showNodes))}
      {renderToggle("Show Edges", showEdges, () => setShowEdges(!showEdges))}
      {renderToggle("Show Labels", showLabels, () =>
        setShowLabels(!showLabels)
      )}

      {SHOW_REGENERATE_BUTTON &&
        !editPolygon &&
        renderSidePanelButton(
          "Regenerate",
          handleRegenerate,
          RED_BUTTON_STYLE + " text-base"
        )}
    </div>
  );
};

export default VisibilityTab;
