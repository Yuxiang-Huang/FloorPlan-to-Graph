import React, { useContext } from "react";
import { ID, RoomInfo, RoomTypeList } from "../../shared/types";
import { getRoomId, savingHelper } from "../../shared/utils";
import { RoomsContext } from "../../contexts/RoomsProvider";
import { SaveStatusContext } from "../../contexts/SaveStatusProvider";
import { IdEventsContext } from "../../contexts/IdEventsProvider";
import { GraphContext } from "../../contexts/GraphProvider";
import RoomInfoButtons from "./RoomInfoButtons";
import { renderCell } from "../../shared/displayUtils";
import { toast } from "react-toastify";
import EditCell from "../EditCell";
import EditTypeRow from "../SelectTypeCell";
import AliasesMultiSelect from "./AliasesMultiSelect";

interface Props {
  floorCode: string;
}

const RoomInfoDisplay = ({ floorCode }: Props) => {
  const setSaveStatus = useContext(SaveStatusContext);

  const { rooms, setRooms } = useContext(RoomsContext);
  const { nodes } = useContext(GraphContext);
  const { idSelected } = useContext(IdEventsContext);

  const roomId = getRoomId(nodes, idSelected);
  const room = rooms[roomId];

  const renderIdRow = (text: string, id: ID) => {
    const copyId = () => {
      navigator.clipboard.writeText(id);
      toast.success("Copied!");
    };

    return (
      <tr>
        {renderCell(text)}
        <td className="border p-2">
          <button
            className="whitespace-nowrap border px-1 text-sm hover:bg-sky-700"
            onClick={copyId}
          >
            Copy ID
          </button>
        </td>
      </tr>
    );
  };

  const handleSaveHelper = (newRoomInfo: RoomInfo) => {
    // frontend update
    const newRooms = JSON.parse(JSON.stringify(rooms));
    newRooms[roomId] = newRoomInfo;
    setRooms(newRooms);

    // backend update
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

  const renderEditNameRow = () => {
    const handleSaveName = async (editedValue, _, setIsEditing) => {
      setIsEditing(false);

      const newRoomInfo = { ...room, name: editedValue };

      handleSaveHelper(newRoomInfo);
    };

    return (
      <tr>
        <td className="border pl-4 pr-4">name</td>
        <EditCell
          property="name"
          value={room.name}
          handleSave={handleSaveName}
        />
      </tr>
    );
  };

  const renderEditTypeRow = () => {
    const handleChange = (setSelectedOption) => async (newValue) => {
      setSelectedOption(newValue);
      const newRoomInfo = { ...room, type: newValue.value };
      handleSaveHelper(newRoomInfo);
    };

    return (
      <tr>
        <td className="border pl-4 pr-4">type</td>
        <EditTypeRow
          key={roomId}
          defaultType={room.type}
          typeList={RoomTypeList}
          handleChange={handleChange}
        />
      </tr>
    );
  };

  const renderEditAliasesRow = () => {
    return (
      <tr>
        <td className="border pl-4 pr-4">aliases</td>
        <td className="border p-2 text-black">
          <AliasesMultiSelect
            key={roomId}
            room={room}
            handleSaveHelper={handleSaveHelper}
          />
        </td>
      </tr>
    );
  };

  return (
    <>
      <table className="table-auto">
        <tbody>
          <tr>
            {renderCell("Property", { bold: true })}
            {renderCell("Value", { bold: true })}
          </tr>
          {renderIdRow("room id", roomId)}
          {renderEditNameRow()}
          {renderEditTypeRow()}
          {renderEditAliasesRow()}
          <RoomInfoButtons floorCode={floorCode} />
        </tbody>
      </table>
    </>
  );
};

export default RoomInfoDisplay;
