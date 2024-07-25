import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { ID, Node, RoomInfo, DoorInfo, WalkwayTypeList } from "./shared/types";

import { TEST_WALKWAYS, TEST_LOADER } from "../API-Settings";

// components
import SidePanel from "./side-panel/SidePanel";
import ZoomPanWrapper from "./zoom-pan/ZoomPanWrapper";

// context providers
import { LoadingContext } from "./contexts/LoadingProvider";
import VisibilitySettingsProvider from "./contexts/VisibilitySettingsProvider";
import GraphProvider from "./contexts/GraphProvider";
import RoomsProvider from "./contexts/RoomsProvider";
import OutlineProvider from "./contexts/OutlineProvider";
import { toast } from "react-toastify";
import { GRAPH_SELECT, ModeContext } from "./contexts/ModeProvider";
import { Polygon } from "geojson";
import PolygonProvider from "./contexts/PolygonProvider";
import { getNodeIdSelected } from "./shared/utils";
import {
  deleteNode,
  setModeAddDoorNode,
  setModeAddEdge,
  setModeAddNode,
  setModeDeleteEdge,
} from "./shared/keyboardShortcuts";
import NodeSizeProvider from "./contexts/NodeSizeProvider";
import IdEventsProvider from "./contexts/IdEventsProvider";
import { IdSelectedInfo } from "./contexts/IdEventsTypes";
import InfoDisplay from "./info-display/InfoDisplay";
import { SaveStatus, Saved } from "./contexts/SaveStatusType";
import { DEFAULT_DENSITY } from "../app/api/detectWalkway/detectWalkway";
import DisplaySettingsProvider from "./contexts/DisplaySettingsProvider";
import ShortcutsStatusProvider from "./contexts/ShortcutsStatusProvider";
import { useRouter } from "next/navigation";

interface Props {
  floorCode: string;
  idSelected: IdSelectedInfo;
  setIdSelected: Dispatch<SetStateAction<IdSelectedInfo>>;
}

const MainDisplay = ({ floorCode, idSelected, setIdSelected }: Props) => {
  const router = useRouter();

  const { loadingText, setLoadingText } = useContext(LoadingContext);
  const { mode, setMode } = useContext(ModeContext);

  const [shortcutsDisabled, setShortcutsDisabled] = useState<boolean>(false);
  const [nodeSize, setNodeSize] = useState<number>(5);

  // id events data
  const [nodeIdHovered, setNodeIdHovered] = useState<ID>("");

  const idEventsData = {
    idSelected,
    setIdSelected,
    nodeIdHovered,
    setNodeIdHovered,
  };

  // warning before closing tab
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(Saved);

  useEffect(() => {
    const handleWindowClose = (e) => {
      if (saveStatus !== Saved) e.preventDefault();
    };
    window.addEventListener("beforeunload", handleWindowClose);
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
    };
  }, [saveStatus]);

  // visibility settings
  const [showFile, setShowFile] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  const visibilitySettings = {
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
  };

  // display data
  const [width, setWidth] = useState<number>(0); //window.innerWidth
  const [height, setHeight] = useState<number>(0); //window.innerHeight
  const [walls, setWalls] = useState<number[][]>([]);
  const [doors, setDoors] = useState<Record<ID, DoorInfo>>({});
  const [roomlessDoors, setRoomlessDoors] = useState<number[][]>([]);
  const [rooms, setRooms] = useState<Record<ID, RoomInfo>>({});
  const [nodes, setNodes] = useState<Record<ID, Node>>({});

  const outlineData = {
    width,
    height,
    walls,
    doors,
    setDoors,
    roomlessDoors,
    setRoomlessDoors,
  };

  // room info display settings
  const [showRoomSpecific, setShowRoomSpecific] = useState<boolean>(false);
  const [editPolygon, setEditPolygon] = useState<boolean>(false);
  const [editRoomLabel, setEditRoomLabel] = useState<boolean>(false);

  const roomDisplaySettingsData = {
    showRoomSpecific,
    setShowRoomSpecific,
    editPolygon,
    setEditPolygon,
    editRoomLabel,
    setEditRoomLabel,
  };

  // polygon editing history
  const [history, setHistory] = useState<Polygon[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [coordsIndex, setCoordsIndex] = useState<number>(0);

  const polygonData = {
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    coordsIndex,
    setCoordsIndex,
  };

  const parsePDF = useCallback(
    async (regenerate = false) => {
      setLoadingText("Parsing PDF");

      if (TEST_LOADER) await new Promise((r) => setTimeout(r, 1000000));

      // parsing the file
      const parseResponse = await fetch("/api/parsePDF", {
        method: "POST",
        body: JSON.stringify({
          floorCode: floorCode,
          regenerate: regenerate,
        }),
      });

      const parsedBody = await parseResponse.json();

      // handle error
      if (!parseResponse.ok) {
        console.error(parsedBody.error);
        setLoadingText("Failed to parse PDF! Check console for detailed error");
        return;
      }

      const parsedRes = parsedBody.result;

      if (parsedRes["floorCodeDNE"]) {
        toast.warn(
          "Couldn't add type and alias because this floor code does not exist in Nicolas-export.json!",
          { autoClose: 5000 }
        );
      }

      setWidth(parsedRes["width"]);
      setHeight(parsedRes["height"]);
      setWalls(parsedRes["walls"]);
      setDoors(parsedRes["doors"]);
      setRoomlessDoors(parsedRes["roomlessDoors"]);
      setRooms(parsedRes["rooms"]);

      setLoadingText("Detecting Walkways");

      if (!parsedRes["calculated"] || TEST_WALKWAYS) {
        const newRooms = parsedRes["rooms"];
        const walkways = Object.keys(newRooms).filter((roomId) =>
          WalkwayTypeList.includes(newRooms[roomId].type)
        );

        if (walkways.length > 0) {
          const walkwayResult = await fetch("/api/detectWalkway", {
            method: "POST",
            body: JSON.stringify({
              floorCode: floorCode,
              walkways: walkways,
              density: DEFAULT_DENSITY,
            }),
          });

          const walkwayBody = await walkwayResult.json();

          if (!walkwayResult.ok) {
            console.log(walkwayBody);
            return;
          }
        }
      }

      const graphResult = await fetch(`/api/getGraph?floorCode=${floorCode}`, {
        method: "GET",
      });

      const graphBody = await graphResult.json();

      if (!graphResult.ok) {
        console.log(graphBody);
        return;
      }

      setNodes(graphBody.result);

      setLoadingText("");
    },
    [floorCode, setLoadingText]
  );

  // fetch data
  useEffect(() => {
    parsePDF();
  }, [floorCode, parsePDF]);

  // keyboard shortcuts
  useEffect(() => {
    if (editPolygon || shortcutsDisabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const toastNodeNotSelectedErr = () => toast.error("Select a node first!");

      const nodeIdSelected = getNodeIdSelected(idSelected);

      // visibility
      if (event.key === "f") {
        setShowFile(!showFile);
      } else if (event.key === "o") {
        setShowOutline(!showOutline);
      } else if (event.key === "g") {
        setShowNodes(!showNodes);
        setShowEdges(!showEdges);
      } else if (event.key === "l") {
        setShowLabels(!showLabels);
      }

      // graph
      else if (event.key === "n") {
        setModeAddNode(setMode);
      } else if (event.key === "e") {
        if (nodeIdSelected) {
          setModeAddEdge(setMode);
        } else {
          toastNodeNotSelectedErr();
        }
      } else if (event.key === "d") {
        if (nodeIdSelected) {
          setModeDeleteEdge(setMode);
        } else {
          toastNodeNotSelectedErr();
        }
      } else if (
        event.key === "Backspace" ||
        event.key === "Delete" ||
        event.key === "Escape"
      ) {
        if (nodeIdSelected) {
          deleteNode(
            nodes,
            nodeIdSelected,
            setNodes,
            floorCode,
            setMode,
            setSaveStatus,
            setIdSelected,
            router
          );
        } else {
          toastNodeNotSelectedErr();
        }
      } else if (event.key === "w") {
        setModeAddDoorNode(setMode);
      }

      // quit
      else if (event.key === "q") {
        setMode(GRAPH_SELECT);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    floorCode,
    mode,
    idSelected,
    nodes,
    setMode,
    shortcutsDisabled,
    editPolygon,
    showFile,
    showOutline,
    showNodes,
    showEdges,
    showLabels,
    router,
    setIdSelected,
  ]);

  return (
    !loadingText && (
      <DisplaySettingsProvider displaySettingsData={roomDisplaySettingsData}>
        <ShortcutsStatusProvider
          shortcutsStatusData={{ shortcutsDisabled, setShortcutsDisabled }}
        >
          <IdEventsProvider idEventsData={idEventsData}>
            <NodeSizeProvider nodeSizeData={{ nodeSize, setNodeSize }}>
              <PolygonProvider polygonData={polygonData}>
                <RoomsProvider roomsData={{ rooms, setRooms }}>
                  <OutlineProvider outlineData={outlineData}>
                    <GraphProvider graphData={{ nodes, setNodes }}>
                      <VisibilitySettingsProvider
                        visibilitySettingsData={visibilitySettings}
                      >
                        <div className="fixed top-1/2 z-50 -translate-y-1/2">
                          <SidePanel
                            floorCode={floorCode}
                            parsePDF={parsePDF}
                          />
                        </div>
                        <div className="relative left-60 p-4 pt-20">
                          <ZoomPanWrapper floorCode={floorCode} />
                        </div>
                        {getNodeIdSelected(idSelected) && (
                          <div className="absolute right-0 top-24 z-50">
                            <InfoDisplay floorCode={floorCode} />
                          </div>
                        )}
                      </VisibilitySettingsProvider>
                    </GraphProvider>
                  </OutlineProvider>
                </RoomsProvider>
              </PolygonProvider>
            </NodeSizeProvider>
          </IdEventsProvider>
        </ShortcutsStatusProvider>
      </DisplaySettingsProvider>
    )
  );
};

export default MainDisplay;
