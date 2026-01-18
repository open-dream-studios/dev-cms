// server/handlers/modules/estimations/graphs/graph_edges/graph_edge_repositories.ts
import { ulid } from "ulid";
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "../../../../../connection/connect.js";

export const getEdgesFunction = async (graph_idx: number) => {
  const [rows] = await db.promise().query<RowDataPacket[]>(
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
  if (!from_node_idx || !to_node_idx) {
    throw new Error("from_node_idx and to_node_idx required");
  }

  const edge_condition = edge.edge_condition ?? {};

  const q = `
    INSERT INTO estimation_graph_edges (
      edge_id,
      graph_idx,
      from_node_idx,
      to_node_idx,
      edge_condition
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      from_node_idx = VALUES(from_node_idx),
      to_node_idx = VALUES(to_node_idx),
      edge_condition = VALUES(edge_condition),
      updated_at = NOW()
  `;

  await connection.query<ResultSetHeader>(q, [
    edge_id,
    graph_idx,
    from_node_idx,
    to_node_idx,
    JSON.stringify(edge_condition),
  ]);

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