// src/pemdas/state/reducer.ts
import { uid } from "../utils/uid";
import {
  Operand,
  PemdasLayer,
  PemdasNode,
  PEMDASNodeType,
  variableScopes,
} from "../types";
import { computeLineWidth, layoutNodes } from "../_helpers/pemdas.helpers";
import { BASE_LINE_WIDTH, WORLD_TOP } from "../_constants/pemdas.constants";
import { FactType, VariableScope } from "@open-dream/shared";

type State = {
  nodes: Record<string, PemdasNode>;
  layers: PemdasLayer[];
};

type Action =
  | {
      type: "ADD_NODE_AT";
      variable: string;
      var_id?: string;
      var_fact_type?: FactType;
      var_scope?: VariableScope;
      nodeType: PEMDASNodeType;
      constantValue?: number;
      layerId: string;
      index: number;
      layerY?: number;
    }
  | {
      type: "REORDER_LAYER";
      layerId: string;
      nodeIds: string[];
    }
  | {
      type: "UPDATE_NODE_OPERAND";
      nodeId: string;
      operand: Operand;
    }
  | {
      type: "DELETE_NODE";
      nodeId: string;
    }
  | {
      type: "UPDATE_NODE_LABEL";
      nodeId: string;
      label: string;
      constantValue: number | undefined;
    }
  | { type: "ENSURE_BUCKETS_FOR_LAYER"; layerId: string };

const INITIAL_LAYERS: PemdasLayer[] = [
  {
    id: "layer-0",
    y: WORLD_TOP + 290,
    nodeIds: [],
    width: BASE_LINE_WIDTH,
  },
];

export const initialState: State = {
  nodes: {},
  layers: INITIAL_LAYERS,
};

function getLayer(state: State, layerId: string) {
  const layer = state.layers.find((l) => l.id === layerId);
  if (!layer) throw new Error(`Layer not found: ${layerId}`);
  return layer;
}

/**
 * Ensure first node's operand is "+" (still hidden in UI, but stored).
 */
function enforceFirstOperandPlus(
  nodes: Record<string, PemdasNode>,
  layer: PemdasLayer
) {
  const firstId = layer.nodeIds[0];
  if (!firstId) return;
  const first = nodes[firstId];
  if (!first) return;
  if (first.operand !== "+") nodes[firstId] = { ...first, operand: "+" };
}

function ensureBuckets(nodes: Record<string, PemdasNode>, layer: PemdasLayer) {
  if (layer.id.startsWith("bucket-")) {
    return { nodes, layer };
  }

  const existing = Object.values(nodes).some(
    (n) => n.nodeType === "contributor-bucket" && n.layerId === layer.id
  );

  if (existing) return { nodes, layer };

  const bucketKeys = ["Labor", "Materials", "Misc"];
  const newNodes = { ...nodes };

  bucketKeys.forEach((key) => {
    const id = `bucket-${key.toLowerCase()}__${layer.id}`;
    newNodes[id] = {
      id,
      nodeType: "contributor-bucket",
      variable: key,
      operand: "+",
      layerId: layer.id,
      x: 0,
      y: layer.y,
    };
  });

  return { nodes: newNodes, layer };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_NODE_AT": {
      let layer = state.layers.find((l) => l.id === action.layerId);

      if (!layer) {
        layer = {
          id: action.layerId,
          y: action.layerY ?? WORLD_TOP + 290,
          nodeIds: [],
          width: BASE_LINE_WIDTH,
        };
      }

      const id = uid();

      if (action.var_scope && variableScopes.includes(action.var_scope)) {
        if (!action.var_fact_type || !action.var_scope) {
          throw new Error("var nodes require var_fact_type and var_scope");
        }
      }

      const node: PemdasNode = {
        id,
        variable: action.variable,
        var_id: action.var_id,
        var_fact_type: action.var_fact_type,
        var_scope: action.var_scope,
        nodeType: action.nodeType,
        x: 0,
        y: layer.y,
        layerId: layer.id,
        constantValue: action.constantValue,
        operand: "+",
      };

      const nodes = { ...state.nodes, [id]: node };

      const nodeIds = [...layer.nodeIds];
      nodeIds.splice(action.index, 0, id);

      const slotCount = nodeIds.filter(
        (id) => nodes[id]?.nodeType !== "contributor-bucket"
      ).length;
      const width = computeLineWidth(slotCount);
      const baseLayer: PemdasLayer = { ...layer, nodeIds, width };

      const ensured = ensureBuckets(nodes, baseLayer);

      layoutNodes(ensured.nodes, ensured.layer);
      enforceFirstOperandPlus(ensured.nodes, ensured.layer);

      const nextLayers = state.layers.some((l) => l.id === layer!.id)
        ? state.layers.map((l) => (l.id === layer!.id ? ensured.layer : l))
        : [...state.layers, ensured.layer];

      return {
        nodes: ensured.nodes,
        layers: nextLayers,
      };
    }

    case "REORDER_LAYER": {
      const layer = getLayer(state, action.layerId);

      const nextLayer: PemdasLayer = {
        ...layer,
        nodeIds: action.nodeIds,
        // width stays fixed during reorder (per your requirement)
        width: layer.width,
      };

      const nodes = { ...state.nodes };
      layoutNodes(nodes, nextLayer);
      enforceFirstOperandPlus(nodes, nextLayer);

      return {
        ...state,
        nodes,
        layers: state.layers.map((l) => (l.id === layer.id ? nextLayer : l)),
      };
    }

    case "UPDATE_NODE_OPERAND": {
      const node = state.nodes[action.nodeId];
      if (!node) return state;

      // don't allow changing if it's first in its layer
      const layer = getLayer(state, node.layerId);
      if (layer.nodeIds[0] === node.id) return state;

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [node.id]: { ...node, operand: action.operand },
        },
      };
    }

    case "DELETE_NODE": {
      const node = state.nodes[action.nodeId];
      if (!node) return state;

      const nextNodes = { ...state.nodes };
      delete nextNodes[action.nodeId];

      const nextLayers = state.layers.map((l) => {
        if (l.id !== node.layerId) return l;

        const nodeIds = l.nodeIds.filter((id) => id !== node.id);

        const slotCount = nodeIds.filter(
          (id) => nextNodes[id]?.nodeType !== "contributor-bucket"
        ).length;
        const width = computeLineWidth(slotCount);

        const nextLayer: PemdasLayer = { ...l, nodeIds, width };

        layoutNodes(nextNodes, nextLayer);
        enforceFirstOperandPlus(nextNodes, nextLayer);

        return nextLayer;
      });

      return { nodes: nextNodes, layers: nextLayers };
    }

    case "UPDATE_NODE_LABEL": {
      const node = state.nodes[action.nodeId];
      if (!node) return state;

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [node.id]: {
            ...node,
            variable: action.label,
            constantValue: action.constantValue,
          },
        },
      };
    }

    case "ENSURE_BUCKETS_FOR_LAYER": {
      const layer = getLayer(state, action.layerId);
      const ensured = ensureBuckets({ ...state.nodes }, layer);
      return {
        nodes: ensured.nodes,
        layers: state.layers.map((l) =>
          l.id === layer.id ? ensured.layer : l
        ),
      };
    }

    default:
      return state;
  }
}
