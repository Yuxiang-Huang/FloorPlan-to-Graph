import { Polygon } from "geojson";

export interface PDFCoordinate {
  x: number;
  y: number;
}

/**
 * Unique ID (UUID)
 * */
export type ID = string;

/**
 * name of the pdf file it is in
 * */
export type Floor = string;

/**
 * Room types
 */
export const EdgeTypeList = [
  "ramp",
  "stairs",
  "elevator",
  "", // not assigned
];

export type EdgeType = (typeof EdgeTypeList)[number];

export interface ToFloorInfo {
  toFloor: Floor;
  /**
   *  "ramp" | "stairs" | "elevator" | "inside" | "outside" | ""
   **/
  type: EdgeType;
}

/**
 * Graph types
 */
export interface Edge {
  /**
   * distance between the two nodes this edge connects or the floor to floor info
   */
  dist: number;
  toFloorInfo?: ToFloorInfo;
}

/**
 * Graph types
 */
export interface Node {
  /**
   * the position (x and y coordinates) of the node
   */
  pos: PDFCoordinate;

  /**
   * (neighbor's id to the edge) for each neighbor of the node
   */
  neighbors: Record<ID, Edge>;

  /**
   * the ID of the Room the node belongs to
   */
  roomId: ID;
}

/**
 * Door type
 */
export interface DoorInfo {
  /**
   * list of lines that outlines the door
   */
  lineList: number[][];

  /**
   * center of the door points
   */
  center: PDFCoordinate;

  /**
   * the id of the rooms this door connects
   */
  roomIds: ID[];
}

/**
 * Room types
 */
export const RoomTypeList = [
  "default",
  "corridor",
  "auditorium",
  "office",
  "classroom",
  "operational", // Used for storage or maintenance, not publicly accessible
  "conference",
  "study",
  "laboratory",
  "computer lab",
  "studio",
  "workshop",
  "vestibule",
  "storage",
  "restroom",
  "stairs",
  "elevator",
  "ramp",
  "dining",
  "store",
  "library",
  "sport",
  "parking",
  "inaccessible",
  "", // not assigned
];

export type RoomType = (typeof RoomTypeList)[number];

export const WalkwayTypeList = ["corridor", "ramp", "library"];

export interface RoomInfo {
  /**
   * The short name of the room, without the building name but including the
   * floor level (e.g. '121' for CUC 121)
   */
  name: string;

  /**
   * The coordinates of the label of the room
   */
  labelPosition: PDFCoordinate;

  /**
   * The type of the room
   */
  type: RoomType;

  /**
   * List of names under which the room is known (e.g. 'McConomy Auditorium')
   */
  aliases: string[];

  /**
   * Geojson polygon that outlines the room
   */
  polygon: Polygon;
}
