// project/src/modules/EstimationModule/EstimationPEMDAS/_helpers/pemdas.serialize.ts
import { getSlotCenters } from "../_helpers/pemdas.helpers";
import { PemdasLayer, PemdasNode } from "../types";

export type PemdasSerialized = {
  layers: {
    id: string;
    y: number;
    nodeIds: string[];
    width: number;
  }[];
  nodes: Record<
    string,
    {
      variable: string;
      nodeType: string;
      operand: string;
      constantValue?: number;
      var_id?: string;
      var_scope?: string;
      var_fact_type?: string;
    }
  >;
};

const hydrateLayout = (state: any) => {
  for (const layer of state.layers) {
    const centers = getSlotCenters(layer.width, layer.nodeIds.length);

    layer.nodeIds.forEach((id: string, i: number) => {
      const node = state.nodes[id];
      if (!node) return;
      node.x = centers[i];
      node.layerId = layer.id;
    });
  }
};

export function serializePemdasState(state: {
  layers: PemdasLayer[];
  nodes: Record<string, PemdasNode>;
}): PemdasSerialized {
  return {
    layers: state.layers.map((l) => ({
      id: l.id,
      y: l.y,
      nodeIds: l.nodeIds,
      width: l.width,
    })),
    nodes: Object.fromEntries(
      Object.entries(state.nodes).map(([id, n]) => [
        id,
        {
          variable: n.variable,
          nodeType: n.nodeType,
          operand: n.operand,
          constantValue: n.constantValue,
          var_id: n.var_id,
          var_scope: n.var_scope,
          var_fact_type: n.var_fact_type,
        },
      ])
    ),
  };
}

export function deserializePemdasState(data: PemdasSerialized): {
  layers: PemdasLayer[];
  nodes: Record<string, PemdasNode>;
} {
  const nodes: Record<string, PemdasNode> = {};

  for (const [id, n] of Object.entries(data.nodes)) {
    nodes[id] = {
      id,
      x: 0,
      y: 0,
      layerId: "",
      operand: n.operand as any,
      variable: n.variable,
      nodeType: n.nodeType as any,
      constantValue: n.constantValue,
      var_id: n.var_id,
      var_scope: n.var_scope as any,
      var_fact_type: n.var_fact_type as any,
    };
  }

  const layers = data.layers.map((l) => {
    l.nodeIds.forEach((id) => {
      if (nodes[id]) {
        nodes[id].layerId = l.id;
        nodes[id].y = l.y;
      }
    });
    return l;
  });

  const state = { layers, nodes };

  hydrateLayout(state);

  return state;
}
