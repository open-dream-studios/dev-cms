// server/handlers/modules/estimations/runtime/graph_loader.ts
import { db } from "../../../../connection/connect.js";
import type { RowDataPacket } from "mysql2/promise";
import type { GraphEdge, GraphNode, LoadedGraph } from "./types.js";

export const loadGraph = async (graph_idx: number): Promise<LoadedGraph> => {
  const [[graphMeta]] = await db
    .promise()
    .query<(RowDataPacket & { graph_type: string })[]>(
      `
      SELECT id, graph_type
      FROM estimation_graphs
      WHERE id = ?
      `,
      [graph_idx]
    );

  if (!graphMeta) {
    throw new Error(`Graph not found: ${graph_idx}`);
  }

  const [nodeRows] = await db
    .promise()
    .query<(GraphNode & RowDataPacket)[]>(
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

  const [edgeRows] = await db
    .promise()
    .query<(GraphEdge & RowDataPacket)[]>(
      `
      SELECT id, from_node_idx, to_node_idx, edge_condition, execution_priority
      FROM estimation_graph_edges
      WHERE graph_idx = ?
      `,
      [graph_idx]
    );

  const nodesById = new Map<number, GraphNode>();
  const edgesFromNode = new Map<number, GraphEdge[]>();
  const incomingToNode = new Map<number, GraphEdge[]>();

  for (const n of nodeRows) {
    if (typeof n.config === "string") {
      n.config = JSON.parse(n.config);
    }
    nodesById.set(n.id, n);
    edgesFromNode.set(n.id, []);
    incomingToNode.set(n.id, []);
  }

  for (const e of edgeRows) {
    edgesFromNode.get(e.from_node_idx)?.push(e);
    incomingToNode.get(e.to_node_idx)?.push(e);
  }

  // ⚠️ ENTRY NODE LOGIC ONLY FOR DECISION GRAPHS
  if (graphMeta.graph_type === "decision") {
    const entryNodes = nodeRows.filter(
      (n) => (incomingToNode.get(n.id)?.length ?? 0) === 0
    );

    if (!entryNodes.length) {
      throw new Error("Decision graph has no entry nodes");
    }
  }

  return {
    graph_idx,
    graph_type: graphMeta.graph_type,
    nodesById,
    edgesFromNode,
    incomingToNode,
  };
};