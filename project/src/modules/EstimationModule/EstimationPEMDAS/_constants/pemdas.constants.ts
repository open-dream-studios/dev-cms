import { PEMDASNodeType } from "../types";

export const WORLD_TOP = -600;
export const WORLD_BOTTOM_PADDING = 200;

export const NODE_SIZE = 48;
export const EDGE_PADDING = 42;
export const BASE_LINE_WIDTH = 300;
export const SLOT_WIDTH = NODE_SIZE;

export const MIN_NODE_GAP = 40; 
export const BASE_WORLD_HEIGHT = 900;

export const nodeColors: Record<PEMDASNodeType, string> = {
  fact: "#22C55E",
  geometric: "#A855F7",
  project: "#EF4444", 
  "contributor-node": "#3B82F6",
  "contributor-bucket": "#429",
  constant: "#666"
};

export const BUCKETS = ["labor", "materials", "misc"] as const;
export type BucketType = "labor" | "materials" | "misc"

export const BUCKET_COLORS = {
  labor: "#ff8902", // orange
  materials: "#0F766E", // dark teal
  misc: "#7C3AED", // deep violet
};