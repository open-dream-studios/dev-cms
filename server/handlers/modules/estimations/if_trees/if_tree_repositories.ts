// server/handlers/modules/estimations/if_trees/if_tree_repositories.ts
import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { db } from "../../../../connection/connect.js";
import { IfDecisionReturnType } from "@open-dream/shared";

export const listIfTreesRepo = async (project_idx: number) => {
  const [rows] = await db
    .promise()
    .query(`SELECT * FROM estimation_if_decision_trees WHERE project_idx = ?`, [
      project_idx,
    ]);
  return rows;
};

export const upsertIfTreeRepo = async (
  conn: PoolConnection,
  project_idx: number,
  body: { id?: number; return_type: IfDecisionReturnType }
) => {
  const { id, return_type } = body;

  if (id) {
    await conn.query(
      `UPDATE estimation_if_decision_trees
       SET return_type = ?
       WHERE id = ? AND project_idx = ?`,
      [return_type, id, project_idx]
    );
    return { id };
  }

  const [res] = await conn.query<ResultSetHeader>(
    `INSERT INTO estimation_if_decision_trees (project_idx, return_type)
     VALUES (?, ?)`,
    [project_idx, return_type]
  );

  console.log("[upsertIfTreeRepo] inserted tree", {
    insertId: res.insertId,
    return_type,
  });

  return { id: res.insertId };
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
