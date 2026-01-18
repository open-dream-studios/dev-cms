// server/handlers/modules/estimations/runtime/graph_loaders.ts
import { db } from "../../../../connection/connect.js";
import type { RowDataPacket } from "mysql2/promise";
import { GraphEdge, GraphNode, LoadedGraph } from "./types.js";

export const loadGraph = async (graph_idx: number): Promise<LoadedGraph> => {
  const [nodeRows] = await db.promise().query<(GraphNode & RowDataPacket)[]>(
    `
    SELECT id, node_id, node_type, label, config
    FROM estimation_graph_nodes
    WHERE graph_idx = ?
    `,
    [graph_idx]
  );

  if (!nodeRows.length) {
    throw new Error("Graph has no nodes");
  }

  const [edgeRows] = await db.promise().query<(GraphEdge & RowDataPacket)[]>(
    `
  SELECT id, from_node_idx, to_node_idx, edge_condition
  FROM estimation_graph_edges
  WHERE graph_idx = ?
  `,
    [graph_idx]
  );

  const nodesById = new Map<number, GraphNode>();
  nodeRows.forEach((n) => {
    if (typeof n.config === "string") {
      n.config = JSON.parse(n.config);
    }
    nodesById.set(n.id, n);
  });

  const edgesFromNode = new Map<number, GraphEdge[]>();
  const incomingToNode = new Map<number, GraphEdge[]>();

  edgeRows.forEach((e) => {
    if (!nodesById.has(e.from_node_idx)) {
      throw new Error(`Missing from_node ${e.from_node_idx}`);
    }
    if (!nodesById.has(e.to_node_idx)) {
      throw new Error(`Missing to_node ${e.to_node_idx}`);
    }

    if (!edgesFromNode.has(e.from_node_idx)) {
      edgesFromNode.set(e.from_node_idx, []);
    }
    edgesFromNode.get(e.from_node_idx)!.push(e);

    if (!incomingToNode.has(e.to_node_idx)) {
      incomingToNode.set(e.to_node_idx, []);
    }
    incomingToNode.get(e.to_node_idx)!.push(e);
  });

  const entryNodes = nodeRows.filter((n) => !incomingToNode.has(n.id));

  if (!entryNodes.length) {
    throw new Error("Graph has no entry nodes");
  }

  return {
    graph_idx,
    nodesById,
    edgesFromNode,
    incomingToNode,
    entryNodes,
  };
};
