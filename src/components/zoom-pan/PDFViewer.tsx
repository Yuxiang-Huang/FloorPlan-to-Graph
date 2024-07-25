import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { getBuildingCode } from "../../app/api/apiUtils";
import { PDFCoordinate } from "../shared/types";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  floorCode: string;
  scale: number;
  offset: PDFCoordinate;
}

const PDFViewer = ({ floorCode, scale, offset }: Props) => {
  const buildingCode = getBuildingCode(floorCode);
  const pdfFilePath = `pdf/${buildingCode}/${floorCode}.pdf`;

  return (
    <div
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      <Document file={pdfFilePath}>
        <div className={"border border-gray-400"}>
          <Page pageNumber={1} scale={scale} />
        </div>
      </Document>
    </div>
  );
};

export default PDFViewer;
