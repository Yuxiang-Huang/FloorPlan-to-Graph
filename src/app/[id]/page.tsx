"use client";

import { Slide, ToastContainer } from "react-toastify";
import MainDisplay from "../../components/MainDisplay";
import NavBar from "../../components/NavBar";
import { useEffect } from "react";
import { useState } from "react";
import FloorSwitcher from "../../components/FloorSwitcher";
import {
  DOOR,
  DefaultIdSelected,
  IdSelectedInfo,
  NODE,
} from "../../components/contexts/IdEventsTypes";
import ModeProvider, {
  GRAPH_SELECT,
  Mode,
} from "../../components/contexts/ModeProvider";
import Loader from "../../components/common/Loader";

import HelpInfo from "../../components/zoom-pan/HelpInfo";
import SaveStatusProvider from "../../components/contexts/SaveStatusProvider";
import LoadingProvider from "../../components/contexts/LoadingProvider";
import {
  SaveStatus,
  Saved,
  saveStatusToColor,
} from "../../components/contexts/SaveStatusType";
import FloorLevelsProvider from "../../components/contexts/FloorLevelsProvider";
import { useRouter, useSearchParams } from "next/navigation";

const Page = ({ params }: { params: { id: string } }) => {
  const router = useRouter();

  // get floor info
  const floorInfo = params.id;

  if (floorInfo == null) {
    throw "Invalid Building Code";
  }

  const floorInfoArr = floorInfo.split("-");
  const buildingCode = floorInfoArr[0];
  const floorLevelSelected = floorInfoArr[1];

  // get floor levels
  const [floorLevels, setFloorLevels] = useState<string[]>([]);
  useEffect(() => {
    const getFloorLevels = async () => {
      const response = await fetch(
        `/api/getFloorCodes?buildingCode=${buildingCode}`,
        {
          method: "GET",
        }
      );

      const body = await response.json();

      // handle error
      if (!response.ok) {
        console.log(body);
        return;
      }

      const getFloorLevel = (f: string) => {
        f = f.replace(".pdf", "");
        const farr = f.split("-");
        return farr[farr.length - 1];
      };

      const sortFloorLevels = (floorLevels: string[]) => {
        const floorCodeOrder = [
          "PH",
          "9",
          "8",
          "7",
          "6",
          "5",
          "4",
          "3",
          "2",
          "M",
          "1",
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "LL",
          "EV",
        ];

        const floorLevelSort = (f1: string, f2: string) => {
          return floorCodeOrder.indexOf(f2) - floorCodeOrder.indexOf(f1);
        };

        return floorLevels.sort(floorLevelSort);
      };

      const newFloorLevels = sortFloorLevels(
        body.result.map((floorCode) => getFloorLevel(floorCode))
      );

      if (floorInfoArr.length == 1) {
        router.push(
          buildingCode +
            "-" +
            newFloorLevels[Math.floor(newFloorLevels.length / 2)]
        );
      }

      setFloorLevels(sortFloorLevels(newFloorLevels));
    };
    getFloorLevels();
  }, [buildingCode, floorInfoArr.length, router]);

  const searchParams = useSearchParams();

  const [idSelected, setIdSelected] =
    useState<IdSelectedInfo>(DefaultIdSelected);

  useEffect(() => {
    const nodeId = searchParams.get("nodeId");
    const doorId = searchParams.get("doorId");

    if (nodeId) {
      setIdSelected({ id: nodeId, type: NODE });
    } else if (doorId) {
      setIdSelected({ id: doorId, type: DOOR });
    } else {
      setIdSelected(DefaultIdSelected);
    }
  }, [searchParams]);

  const [loadingText, setLoadingText] = useState<string>("Loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(Saved);
  const [mode, setMode] = useState<Mode>(GRAPH_SELECT);

  // reset mode when switch floor
  useEffect(() => {
    setMode(GRAPH_SELECT);
  }, [floorLevelSelected]);

  const renderResetModeButtton = () => {
    return (
      <button
        className="fixed bottom-10 m-1 rounded border border-black p-1 hover:bg-gray-200"
        onClick={() => setMode(GRAPH_SELECT)}
      >
        Reset Mode
      </button>
    );
  };

  return (
    <div>
      <div className="absolute inset-0 z-50 h-min">
        <NavBar buildingCode={buildingCode} />
      </div>

      {floorLevelSelected && (
        <>
          {loadingText && <Loader loadingText={loadingText} />}

          <FloorLevelsProvider floorLevels={floorLevels}>
            <LoadingProvider loadingData={{ loadingText, setLoadingText }}>
              <SaveStatusProvider setSaveStatus={setSaveStatus}>
                <ModeProvider modeData={{ mode, setMode }}>
                  <MainDisplay
                    floorCode={buildingCode + "-" + floorLevelSelected}
                    idSelected={idSelected}
                    setIdSelected={setIdSelected}
                  />
                </ModeProvider>
              </SaveStatusProvider>
            </LoadingProvider>
          </FloorLevelsProvider>

          {!loadingText && (
            <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
              <FloorSwitcher
                buildingCode={buildingCode}
                floorLevels={floorLevels}
                floorLevelSelected={floorLevelSelected}
              />
            </div>
          )}

          <HelpInfo />

          <div className="absolute top-16 h-full">
            <div
              className={`sticky top-4 m-1 rounded border border-gray-500 p-1 ${saveStatusToColor[saveStatus]}`}
            >
              {saveStatus}
            </div>
          </div>

          {renderResetModeButtton()}
          <div className="fixed bottom-0 m-2">Mode: {mode}</div>
        </>
      )}

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={true}
        closeOnClick
        theme="colored"
        transition={Slide}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      />
    </div>
  );
};

export default Page;
