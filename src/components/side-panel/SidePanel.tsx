import React, { useContext, useEffect, useState } from "react";
import VisibilityTab from "./VisibilityTab";
import GraphTab from "./GraphTab";
import PolygonTab from "./PolygonTab";
import { ShortcutsStatusContext } from "../contexts/ShortcutsStatusProvider";
import { DisplaySettingsContext } from "../contexts/DisplaySettingsProvider";
import { IdEventsContext } from "../contexts/IdEventsProvider";
import { getRoomId } from "../shared/utils";
import { GraphContext } from "../contexts/GraphProvider";

interface Props {
  floorCode: string;
  parsePDF: (regnerate: boolean) => void;
}

const SidePanel = ({ floorCode, parsePDF }: Props) => {
  const { shortcutsDisabled } = useContext(ShortcutsStatusContext);
  const { editPolygon } = useContext(DisplaySettingsContext);
  const { idSelected } = useContext(IdEventsContext);
  const { nodes } = useContext(GraphContext);
  const roomIdSelected = getRoomId(nodes, idSelected);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  useEffect(() => {
    if (shortcutsDisabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "p") {
        if (!editPolygon && roomIdSelected) {
          setActiveTabIndex(1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editPolygon, roomIdSelected, shortcutsDisabled]);

  const tabNames = editPolygon
    ? ["Visibility", "Polygon"]
    : ["Visibility", "Graph"];

  const renderVisibilityTab = () => (
    <VisibilityTab floorCode={floorCode} parsePDF={parsePDF} />
  );

  const renderGraphTab = () => <GraphTab floorCode={floorCode} />;

  const renderPolygonTab = () => <PolygonTab floorCode={floorCode} />;

  const tabContents = editPolygon
    ? [renderVisibilityTab, renderPolygonTab]
    : [renderVisibilityTab, renderGraphTab];

  return (
    <div className="h-[22em] w-fit rounded-lg border bg-slate-400 shadow-lg">
      <h1 className="pt-2 text-center text-xl underline">Settings</h1>
      <ul className="flex text-sm">
        {tabNames.map((tabName, index) => (
          <button
            key={index}
            className={`mb-3 cursor-pointer border-b-2 px-3 pb-2 pt-4 text-center font-medium ${
              activeTabIndex === index
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={() => setActiveTabIndex(index)}
          >
            {tabName}
          </button>
        ))}
      </ul>
      {tabContents[activeTabIndex]()}
    </div>
  );
};

export default SidePanel;
