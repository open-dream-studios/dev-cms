// graph_nodes_repositories.ts
import { ulid } from "ulid";
import type { PoolConnection } from "mysql2/promise";
import { db } from "../../../../../connection/connect.js";

export const getNodesFunction = async (graph_idx: number) => {
  const [rows] = await db.promise().query(
    `SELECT * FROM estimation_graph_nodes WHERE graph_idx = ?`,
    [graph_idx]
  );
  return rows;
};

export const upsertNodeFunction = async (
  connection: PoolConnection,
  graph_idx: number,
  node: any
) => {
  const node_id = node.node_id || `NODE-${ulid()}`;

  await connection.query(
    `
    INSERT INTO estimation_graph_nodes (
      node_id, graph_idx, node_type, label, config, position
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      label = VALUES(label),
      config = VALUES(config),
      position = VALUES(position),
      updated_at = NOW()
    `,
    [
      node_id,
      graph_idx,
      node.node_type,
      node.label,
      JSON.stringify(node.config),
      JSON.stringify(node.position)
    ]
  );

  return { success: true, node_id };
};

export const deleteNodeFunction = async (
  connection: PoolConnection,
  node_id: string
) => {
  await connection.query(
    `DELETE FROM estimation_graph_nodes WHERE node_id = ?`,
    [node_id]
  );
  return { success: true };
};