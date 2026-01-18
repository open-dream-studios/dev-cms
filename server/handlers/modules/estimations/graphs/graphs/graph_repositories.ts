// estimation_graphs_repositories.ts
import { ulid } from "ulid";
import type { PoolConnection } from "mysql2/promise";
import { db } from "../../../../../connection/connect.js";

export const getGraphsFunction = async (project_idx: number) => {
  const [rows] = await db.promise().query(
    `SELECT * FROM estimation_graphs WHERE project_idx = ? ORDER BY created_at DESC`,
    [project_idx]
  );
  return rows;
};

export const createGraphFunction = async (
  connection: PoolConnection,
  project_idx: number,
  { name, graph_type }: any
) => {
  const graph_id = `GRAPH-${ulid()}`;
  await connection.query(
    `
    INSERT INTO estimation_graphs (graph_id, project_idx, graph_type, name)
    VALUES (?, ?, ?, ?)
    `,
    [graph_id, project_idx, graph_type, name]
  );
  return { success: true, graph_id };
};

export const updateGraphFunction = async (
  connection: PoolConnection,
  project_idx: number,
  { graph_id, name }: any
) => {
  await connection.query(
    `
    UPDATE estimation_graphs
    SET name = ?, updated_at = NOW()
    WHERE graph_id = ? AND project_idx = ?
    `,
    [name, graph_id, project_idx]
  );
  return { success: true };
};

export const publishGraphFunction = async (
  connection: PoolConnection,
  project_idx: number,
  { graph_id }: any
) => {
  await connection.query(
    `
    UPDATE estimation_graphs
    SET status = 'published'
    WHERE graph_id = ? AND project_idx = ?
    `,
    [graph_id, project_idx]
  );
  return { success: true };
};