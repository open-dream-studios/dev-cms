// server/handlers/modules/estimations/if_trees/if_tree_repositories.ts
import type { PoolConnection } from "mysql2/promise";
import { db } from "../../../../connection/connect.js";

export const listIfTreesRepo = async (project_idx: number) => {
  const [rows] = await db.promise().query(
    `SELECT * FROM estimation_if_decision_trees WHERE project_idx = ?`,
    [project_idx]
  );
  return rows;
};

export const upsertIfTreeRepo = async (
  conn: PoolConnection,
  project_idx: number,
  body: any
) => {
  const { id, return_type } = body;
  if (!return_type) throw new Error("return_type required");

  const q = `
    INSERT INTO estimation_if_decision_trees (id, project_idx, return_type)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE return_type = VALUES(return_type)
  `;

  await conn.query(q, [id ?? null, project_idx, return_type]);
  return { success: true };
};

export const deleteIfTreeRepo = async (
  conn: PoolConnection,
  project_idx: number,
  id: number
) => {
  await conn.query(
    `DELETE FROM estimation_if_decision_trees WHERE id = ? AND project_idx = ?`,
    [id, project_idx]
  );
  return { success: true };
};