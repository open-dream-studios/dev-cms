// src/pemdas/state/reducer.ts
import { uid } from "../utils/uid";
import { Operand, PemdasLayer, PemdasNode } from "../types";
import { computeLineWidth, layoutNodes } from "../_helpers/pemdas.helpers";
import { BASE_LINE_WIDTH, EDGE_PADDING, NODE_SIZE, WORLD_TOP } from "../_constants/pemdas.constants";

type State = {
  nodes: Record<string, PemdasNode>;
  layers: PemdasLayer[];
};

type Action =
  | {
      type: "ADD_NODE_AT";
      variable: string;
      layerId: string;
      index: number;
      x: number;
    }
  | {
      type: "MOVE_NODE";
      nodeId: string;
      x: number;
      y: number;
    }
  | {
      type: "SET_OPERAND";
      layerId: string;
      index: number;
      operand: Operand;
    }
  | {
      type: "DELETE_NODE";
      nodeId: string;
    };

// const NODE_RADIUS = NODE_SIZE / 2;
// const MIN_GAP = 30;
// const MIN_CENTER_DIST = NODE_SIZE + MIN_GAP;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const INITIAL_LAYERS: PemdasLayer[] = [
  { id: "layer-0", y: WORLD_TOP + 290, nodeIds: [], operands: [], width: BASE_LINE_WIDTH },
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

// function sortNodeIdsByX(nodes: Record<string, PemdasNode>, ids: string[]) {
//   return [...ids].sort((a, b) => (nodes[a]?.x ?? 0) - (nodes[b]?.x ?? 0));
// }

function rebuildOperandsForCount(count: number): Operand[] {
  if (count <= 1) return [];
  return Array.from({ length: count - 1 }, () => "+");
}

// function enforceNoOverlapWithinLayer(
//   nodes: Record<string, PemdasNode>,
//   layer: PemdasLayer,
//   movingNodeId?: string
// ) {
//   const sorted = sortNodeIdsByX(nodes, layer.nodeIds);

//   // Left-to-right pass: push right if overlapping
//   for (let i = 1; i < sorted.length; i++) {
//     const leftId = sorted[i - 1];
//     const rightId = sorted[i];

//     const left = nodes[leftId];
//     const right = nodes[rightId];

//     if (!left || !right) continue;

//     const minRightX = left.x + MIN_CENTER_DIST;
//     if (right.x < minRightX) {
//       // Only move the right node unless it's not allowed (we allow all)
//       nodes[rightId] = { ...right, x: minRightX };
//     }
//   }

//   // Right-to-left pass: if we pushed too far and have a "moving" node,
//   // gently pull others left to reduce drift.
//   // (Keeps layout stable during drags.)
//   for (let i = sorted.length - 2; i >= 0; i--) {
//     const leftId = sorted[i];
//     const rightId = sorted[i + 1];

//     const left = nodes[leftId];
//     const right = nodes[rightId];

//     if (!left || !right) continue;

//     const maxLeftX = right.x - MIN_CENTER_DIST;
//     if (left.x > maxLeftX) {
//       nodes[leftId] = { ...left, x: maxLeftX };
//     }
//   }

//   // Re-sort to keep stable order (optional)
//   const finalSorted = sortNodeIdsByX(nodes, layer.nodeIds);
//   layer.nodeIds = finalSorted;
// }

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_NODE_AT": {
      const layer = getLayer(state, action.layerId);
      const id = uid();

      const node: PemdasNode = {
        id,
        variable: action.variable,
        x: 0,
        y: layer.y,
        layerId: layer.id,
      };

      const nodes = { ...state.nodes, [id]: node };
      const nodeIds = [...layer.nodeIds];
      nodeIds.splice(action.index, 0, id);

      const width = computeLineWidth(nodeIds.length);
      const nextLayer: PemdasLayer = {
        ...layer,
        nodeIds,
        operands: rebuildOperandsForCount(nodeIds.length),
        width,
      };

      layoutNodes(nodes, nextLayer);

      return {
        nodes,
        layers: state.layers.map((l) => (l.id === layer.id ? nextLayer : l)),
      };
    }

    case "MOVE_NODE": {
      const node = state.nodes[action.nodeId];
      if (!node) return state;

      const layer = getLayer(state, node.layerId);
      const minX = EDGE_PADDING + NODE_SIZE / 2;
      const maxX = layer.width - EDGE_PADDING - NODE_SIZE / 2;

      const nextNodes = {
        ...state.nodes,
        [node.id]: {
          ...node,
          x: clamp(action.x, minX, maxX),
          y: layer.y,
        },
      };

      return { ...state, nodes: nextNodes };
    }

    case "SET_OPERAND": {
      const nextLayers = state.layers.map((l) => {
        if (l.id !== action.layerId) return l;
        const ops = [...l.operands];
        if (action.index < 0 || action.index >= ops.length) return l;
        ops[action.index] = action.operand;
        return { ...l, operands: ops };
      });
      return { ...state, layers: nextLayers };
    }

    case "DELETE_NODE": {
      const node = state.nodes[action.nodeId];
      if (!node) return state;

      const nextNodes = { ...state.nodes };
      delete nextNodes[action.nodeId];

      const nextLayers = state.layers.map((l) => {
        if (l.id !== node.layerId) return l;

        const nodeIds = l.nodeIds.filter((id) => id !== node.id);
        const width = computeLineWidth(nodeIds.length);

        const nextLayer = {
          ...l,
          nodeIds,
          operands: rebuildOperandsForCount(nodeIds.length),
          width,
        };

        layoutNodes(nextNodes, nextLayer);
        return nextLayer;
      });
      return { nodes: nextNodes, layers: nextLayers };
    }

    default:
      return state;
  }
}
