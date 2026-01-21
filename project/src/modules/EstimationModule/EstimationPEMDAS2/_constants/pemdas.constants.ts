import { PEMDASNodeType } from "../types";

export const WORLD_TOP = -600;
export const WORLD_BOTTOM = 1600;

export const NODE_SIZE = 48;
export const EDGE_PADDING = 42;
export const BASE_LINE_WIDTH = 300;
export const SLOT_WIDTH = NODE_SIZE;

export const nodeColors: Record<PEMDASNodeType, string> = {
  var: "#22C55E",
  layer: "#A855F7",
  constant: "#3B82F6"
};
