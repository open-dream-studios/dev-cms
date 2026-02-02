// server/handlers/modules/estimations/if_trees/bindings/conditional_repositories.ts
import type { PoolConnection } from "mysql2/promise";
import { validateDecisionTree } from "../decision_tree_validator.js";

export const upsertNodeConditionalRepo = async (
  conn: PoolConnection,
  project_idx: number,
  body: any
) => {
  const { node_id, decision_tree_id, allowedVariableKeys } = body;

  // 🔧 FIX: allow string node ids
  if (!node_id || !decision_tree_id) {
    throw new Error("Missing node_id or decision_tree_id");
  }

  await validateDecisionTree(
    conn,
    project_idx,
    decision_tree_id,
    allowedVariableKeys
  );

  await conn.query(
    `
    INSERT INTO estimation_node_conditionals
      (project_idx, node_id, decision_tree_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE decision_tree_id = VALUES(decision_tree_id)
    `,
    [project_idx, String(node_id), decision_tree_id]
  );

  return { success: true };
};

export const deleteNodeConditionalRepo = async (
  conn: PoolConnection,
  project_idx: number,
  node_id: number
) => {
  await conn.query(
    `
    DELETE FROM estimation_node_conditionals
    WHERE project_idx = ? AND node_id = ?
    `,
    [project_idx, node_id]
  );

  return { success: true };
};
