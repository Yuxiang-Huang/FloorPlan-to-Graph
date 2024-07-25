import React, { Dispatch, SetStateAction, createContext } from "react";
import { DoorInfo, ID } from "../shared/types";

export interface OutlineData {
  width: number;
  height: number;
  walls: number[][];

  doors: Record<ID, DoorInfo>;
  setDoors: Dispatch<SetStateAction<Record<ID, DoorInfo>>>;

  roomlessDoors: number[][];
  setRoomlessDoors: Dispatch<SetStateAction<number[][]>>;
}

export const OutlineContext = createContext<OutlineData>({
  width: 0,
  height: 0,
  walls: [],
  doors: {},
  setDoors: () => {},
  roomlessDoors: [],
  setRoomlessDoors: () => {},
});

interface Props {
  children: React.ReactNode;
  outlineData: OutlineData;
}

export const OutlineProvider = ({
  children,
  outlineData: outlineData,
}: Props) => {
  return (
    <OutlineContext.Provider value={outlineData}>
      {children}
    </OutlineContext.Provider>
  );
};

export default OutlineProvider;
