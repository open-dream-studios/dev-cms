// server/handlers/modules/estimations/if_trees/bindings/adjustment_repositories.ts
import type { PoolConnection } from "mysql2/promise";
import { validateDecisionTree } from "../decision_tree_validator.js";

export const upsertNodeAdjustmentRepo = async (
  conn: PoolConnection,
  project_idx: number,
  body: any
) => {
  const { node_id, decision_tree_id, allowedVariableKeys } = body;
  if (!node_id || !decision_tree_id) throw new Error("Missing fields");

  // await validateDecisionTree(
  //   conn,
  //   project_idx,
  //   decision_tree_id,
  //   allowedVariableKeys
  // );

  await conn.query(
    `
    INSERT INTO estimation_node_adjustments (project_idx, node_id, decision_tree_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE decision_tree_id = VALUES(decision_tree_id)
    `,
    [project_idx, node_id, decision_tree_id]
  );

  return { success: true };
};

export const deleteNodeAdjustmentRepo = async (
  conn: PoolConnection,
  project_idx: number,
  node_id: number
) => {
  await conn.query(
    `
    DELETE FROM estimation_node_adjustments
    WHERE project_idx = ? AND node_id = ?
    `,
    [project_idx, node_id]
  );

  return { success: true };
};