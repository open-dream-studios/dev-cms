import { FactType, VariableScope } from "@open-dream/shared";

// src/pemdas/types.ts
export type VariableKey = string;

export type Operand = "+" | "-" | "×" | "/";

export type PEMDASNodeType = "contributor-node" | "contributor-bucket" | "constant" | VariableScope;
export const variableScopes: VariableScope[] = ["fact", "geometric", "project"]
export type CreatablePEMDASNodeType = "contributor-node" | "constant";
export const creatablePEMDASNodeTypes: CreatablePEMDASNodeType[] = [
  "contributor-node",
  "constant",
];

export type PemdasNode = {
  id: string;
  var_id?: string;
  var_fact_type?: FactType;     // number | string | enum | boolean
  var_scope?: VariableScope;   // fact | geometric | project
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
