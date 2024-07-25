import React, { useContext, useRef, useState } from "react";
import { FloorLevelsContext } from "../../contexts/FloorLevelsProvider";
import { toast } from "react-toastify";
import { ShortcutsStatusContext } from "../../contexts/ShortcutsStatusProvider";
import { GraphContext } from "../../contexts/GraphProvider";
import { getNodeIdSelected } from "../../shared/utils";
import { IdEventsContext } from "../../contexts/IdEventsProvider";

interface Props {
  floorCode: string;
}

const AddEdgeAcrossFloorsSection = ({ floorCode }: Props) => {
  const { setShortcutsDisabled } = useContext(ShortcutsStatusContext);
  const { setNodes } = useContext(GraphContext);
  const { idSelected } = useContext(IdEventsContext);

  const nodeIdSelected = getNodeIdSelected(idSelected);

  const floorLevels = useContext(FloorLevelsContext);

  const [floorCode2, setFloorCode2] = useState("");

  const nodeIdRef = useRef<HTMLInputElement | null>(null);

  const addEdgeWithID = async () => {
    if (!floorCode2) {
      toast.error("Select a Floor!");
      return;
    }

    const response = await fetch("/api/addEdgeAcrossFloors", {
      method: "POST",
      body: JSON.stringify({
        floorCode1: floorCode,
        floorCode2: floorCode2,
        nodeId1: nodeIdSelected,
        nodeId2: nodeIdRef.current?.value,
      }),
    });

    const body = await response.json();

    // handle error
    if (!response.ok) {
      if (response.status == 500) {
        console.log(body);
      } else if (response.status == 400) {
        toast.error(body.error);
      }
      return;
    }

    toast.info(body.message);

    setNodes(body.newGraph);

    // clear inputs
    setFloorCode2("");
    if (nodeIdRef.current) {
      nodeIdRef.current.value = "";
    }
  };

  const renderFloorSelector = () => {
    const floorsArr = floorCode.split("-");
    const floorIndex = floorLevels.indexOf(floorsArr[floorsArr.length - 1]);
    const prefix = floorsArr[0] + "-";

    const handleChange = (event) => {
      setFloorCode2(event.target.value);
    };

    return (
      <div>
        <select
          name="floor"
          id="floor"
          className="rounded text-black"
          value={floorCode2}
          onChange={handleChange}
        >
          <option value="" disabled>
            --Please choose a floor--
          </option>
          {floorIndex != floorLevels.length - 1 && (
            <option value={prefix + floorLevels[floorIndex + 1]}>
              {prefix + floorLevels[floorIndex + 1]}
            </option>
          )}
          {floorIndex != 0 && (
            <option value={prefix + floorLevels[floorIndex - 1]}>
              {prefix + floorLevels[floorIndex - 1]}
            </option>
          )}
          <option value="outside">Campus Outside</option>
        </select>
      </div>
    );
  };

  const renderAutoDetectButton = () => {
    const autoDetect = async () => {
      if (!floorCode2) {
        toast.error("Select a Floor!");
        return;
      }
      const response = await fetch("/api/addEdgeAcrossFloors", {
        method: "POST",
        body: JSON.stringify({
          floorCode1: floorCode,
          floorCode2: floorCode2,
          nodeId1: nodeIdSelected,
        }),
      });

      const body = await response.json();

      // handle error
      if (!response.ok) {
        if (response.status == 500) {
          console.log(body);
        } else if (response.status == 400) {
          toast.error(body.error);
        }
        return;
      }

      toast.info(body.message);

      setNodes(body.newGraph);

      // clear inputs
      setFloorCode2("");
      if (nodeIdRef.current) {
        nodeIdRef.current.value = "";
      }
    };

    return (
      <div>
        <button
          className="mt-4 rounded bg-slate-500 px-2 py-1 text-sm text-white hover:bg-slate-700"
          onClick={autoDetect}
        >
          Autodetect
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center space-x-3">
        <p>Add Edge across Floors</p>
        <div>
          <button
            className="my-1 rounded bg-slate-500 px-2 py-1 text-sm text-white hover:bg-slate-700"
            onClick={addEdgeWithID}
          >
            Add
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {renderFloorSelector()}
        <div>
          <input
            ref={nodeIdRef}
            placeholder="Node ID"
            className="rounded px-2 text-black"
            onFocus={() => setShortcutsDisabled(true)}
            onBlur={() => setShortcutsDisabled(false)}
          />
        </div>
      </div>
      {renderAutoDetectButton()}
    </div>
  );
};

export default AddEdgeAcrossFloorsSection;
