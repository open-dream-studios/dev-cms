// server/handlers/modules/estimations/graphs/graph_edges/graph_edge_repositories.ts
import { ulid } from "ulid";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { db } from "../../../../../connection/connect.js";
import { loadGraph } from "../../runtime/run_graph/graph_loader.js";
import { validateGraphStructure } from "../graphs/validation/graph_validation.js";

export const getEdgesFunction = async (graph_idx: number) => {
  const [rows] = await db
    .promise()
    .query<RowDataPacket[]>(
      `SELECT * FROM estimation_graph_edges WHERE graph_idx = ? ORDER BY created_at ASC`,
      [graph_idx]
    );
  return rows;
};

export const upsertEdgeFunction = async (
  connection: PoolConnection,
  graph_idx: number,
  edge: any
) => {
  const edge_id = edge.edge_id?.trim() || `EDGE-${ulid()}`;
  const from_node_idx = Number(edge.from_node_idx);
  const to_node_idx = Number(edge.to_node_idx);
  const execution_priority = Number(edge.execution_priority ?? 0);

  if (!from_node_idx || !to_node_idx) {
    return { success: false, errors: ["from/to required"], warnings: [] };
  }

  if (from_node_idx === to_node_idx) {
    return {
      success: false,
      errors: ["Edge cannot point to itself"],
      warnings: [],
    };
  }

  const edge_condition = edge.edge_condition ?? {};

  const graph = await loadGraph(graph_idx);

  const edgesFromNode = new Map(graph.edgesFromNode);
  const incomingToNode = new Map(graph.incomingToNode);

  edgesFromNode.set(from_node_idx, [
    ...(edgesFromNode.get(from_node_idx) ?? []),
    {
      from_node_idx,
      to_node_idx,
      edge_condition,
      execution_priority,
    },
  ]);

  incomingToNode.set(to_node_idx, [
    ...(incomingToNode.get(to_node_idx) ?? []),
    {
      from_node_idx,
      to_node_idx,
      edge_condition,
      execution_priority,
    },
  ]);

  const hypotheticalGraph = {
    ...graph,
    edgesFromNode,
    incomingToNode,
  };

  const validation = validateGraphStructure(hypotheticalGraph);

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  await connection.query(
    `
  INSERT INTO estimation_graph_edges (
    edge_id,
    graph_idx,
    from_node_idx,
    to_node_idx,
    edge_condition,
    execution_priority
  ) VALUES (?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    from_node_idx = VALUES(from_node_idx),
    to_node_idx = VALUES(to_node_idx),
    edge_condition = VALUES(edge_condition),
    execution_priority = VALUES(execution_priority),
    updated_at = NOW()
  `,
    [
      edge_id,
      graph_idx,
      from_node_idx,
      to_node_idx,
      JSON.stringify(edge_condition),
      execution_priority,
    ]
  );

  return { success: true, edge_id };
};

export const deleteEdgeFunction = async (
  connection: PoolConnection,
  edge_id: string
) => {
  await connection.query(
    `DELETE FROM estimation_graph_edges WHERE edge_id = ?`,
    [edge_id]
  );
  return { success: true };
};
