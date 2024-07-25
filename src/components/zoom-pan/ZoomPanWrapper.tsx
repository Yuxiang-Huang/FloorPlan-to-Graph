import React, { useContext, useRef, useState } from "react";
import Konva from "konva";

import dynamic from "next/dynamic";
import { PDFCoordinate } from "../shared/types";
import { VisibilitySettingsContext } from "../contexts/VisibilitySettingsProvider";
import { toast } from "react-toastify";

// import PDFViewer from "./PDFViewer";
const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

// import FloorDisplay from "./FloorDisplay";
const FloorDisplay = dynamic(() => import("./FloorDisplay"), {
  ssr: false,
});

interface Props {
  floorCode: string;
}

const ZoomPanWrapper = ({ floorCode }: Props) => {
  const { showFile, setShowFile } = useContext(VisibilitySettingsContext);

  const [canPan, setCanPan] = useState<boolean>(false);

  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<PDFCoordinate>({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const stage = stageRef.current;

    if (stage == null) {
      return;
    }

    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();

    if (pointer == null) {
      return;
    }

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    if (showFile && newScale > 3) {
      toast.warn(
        "The scale is too high to support showing file while zooming!"
      );
      setShowFile(false);
      return;
    }

    if (newScale > 1 && newScale < 7) {
      setScale(Math.max(newScale, 1));
      setOffset({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    }
  };

  const handleDragMove = (e) => {
    if (canPan) {
      setOffset({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  return (
    <>
      {showFile && (
        <PDFViewer
          floorCode={floorCode}
          scale={scale}
          offset={offset}
        ></PDFViewer>
      )}
      <div className="absolute inset-0 z-10 p-4 pt-20">
        <FloorDisplay
          floorCode={floorCode}
          setCanPan={setCanPan}
          handleWheel={handleWheel}
          handleDragMove={handleDragMove}
          scale={scale}
          offset={offset}
          stageRef={stageRef}
        />
      </div>
    </>
  );
};

export default ZoomPanWrapper;
