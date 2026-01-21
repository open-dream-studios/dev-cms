// src/pemdas/types.ts
export type VariableKey = string;

export type Operand = "+" | "-" | "×" | "/";

export type PEMDASNodeType = "layer" | "constant" | "var";
export type CreatablePEMDASNodeType = "layer" | "constant";
export const creatablePEMDASNodeTypes: CreatablePEMDASNodeType[] = ["layer", "constant"];

export type PemdasNode = {
  id: string;
  variable: VariableKey;
  x: number; // layer-local center-x
  y: number; // canvas center-y
  layerId: string;
  nodeType: PEMDASNodeType;
  constantValue?: number; 
  operand: Operand;
};

export type PemdasLayer = {
  id: string;
  y: number;
  nodeIds: string[];
  width: number;
};

export type DragState =
  | { type: "VAR_TEMPLATE"; variable: VariableKey; x: number; y: number }
  | {
      type: "NODE";
      nodeId: string;
      offsetX: number; // mouseX - nodeCenterX at mousedown
      offsetY: number; // mouseY - nodeCenterY at mousedown
      lastX: number; // last nodeCenterX while dragging
      lastY: number; // last nodeCenterY while dragging
    }
  | null;

export type DragGhost = {
  type: "VAR_GHOST";
  variable: VariableKey;
  x: number;
  y: number;
} | null;
