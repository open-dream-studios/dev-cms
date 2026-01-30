// server/handlers/modules/estimations/if_trees/variable_repositories.ts
import type { PoolConnection } from "mysql2/promise";
import { validateDecisionTree } from "./decision_tree_validator.js";

export const listVariablesRepo = async (
  conn: PoolConnection,
  project_idx: number
) => {
  const [rows] = await conn.query(
    `SELECT * FROM estimation_variables WHERE project_idx = ?`,
    [project_idx]
  );
  return rows;
};

export const upsertVariableRepo = async (
  conn: PoolConnection,
  project_idx: number,
  body: any
) => {
  const { var_key, decision_tree_id, allowedVariableKeys } = body;
  if (!var_key || !decision_tree_id) {
    throw new Error("Missing var_key or decision_tree_id");
  }

  await validateDecisionTree(
    conn,
    project_idx,
    decision_tree_id,
    allowedVariableKeys
  );

  const q = `
    INSERT INTO estimation_variables (project_idx, var_key, decision_tree_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      decision_tree_id = VALUES(decision_tree_id)
  `;
  await conn.query(q, [project_idx, var_key, decision_tree_id]);
};

export const deleteVariableRepo = async (
  conn: PoolConnection,
  project_idx: number,
  var_key: string
) => {
  await conn.query(
    `DELETE FROM estimation_variables
     WHERE project_idx = ? AND var_key = ?`,
    [project_idx, var_key]
  );

  return { success: true };
};