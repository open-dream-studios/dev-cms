// src/pemdas/types.ts
export type VariableKey = string;

export type Operand = "+" | "-" | "×" | "/";

export type PemdasNode = {
  id: string;
  variable: VariableKey;
  x: number; // center-x in canvas space
  y: number; // center-y in canvas space
  layerId: string;
};

export type PemdasLayer = {
  id: string;
  y: number;
  nodeIds: string[];
  operands: Operand[];
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
