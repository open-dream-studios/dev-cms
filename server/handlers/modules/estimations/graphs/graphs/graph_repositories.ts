// estimation_graphs_repositories.ts
import { ulid } from "ulid";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { db } from "../../../../../connection/connect.js";

export const getGraphsFunction = async (project_idx: number) => {
  const [rows] = await db
    .promise()
    .query(
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
  const [rows] = await connection.query<RowDataPacket[]>(
    `
  SELECT COALESCE(MAX(version), 0) + 1 AS next_version
  FROM estimation_graphs
  WHERE project_idx = ? AND graph_type = ?
  `,
    [project_idx, graph_type]
  );

  const version = rows[0].next_version;

  const graph_id = `GRAPH-${ulid()}`;
  await connection.query(
    `
    INSERT INTO estimation_graphs (graph_id, project_idx, graph_type, name, version)
    VALUES (?, ?, ?, ?, ?)
    `,
    [graph_id, project_idx, graph_type, name, version]
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
