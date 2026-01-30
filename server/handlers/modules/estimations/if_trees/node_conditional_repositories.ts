// server/handlers/modules/estimations/if_trees/node_conditional_repositories.ts
import { validateDecisionTree } from "./decision_tree_validator.js";
import type { PoolConnection } from "mysql2/promise";

export const upsertNodeConditionalRepo = async (
  conn: PoolConnection,
  project_idx: number,
  body: any
) => {
  const { node_id, decision_tree_id, allowedVariableKeys } = body;
  if (!node_id || !decision_tree_id) throw new Error("Missing fields");

  await validateDecisionTree(
    conn,
    project_idx,
    decision_tree_id,
    allowedVariableKeys
  );

  await conn.query(
    `
    INSERT INTO estimation_node_conditionals (project_idx, node_id, decision_tree_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE decision_tree_id = VALUES(decision_tree_id)
    `,
    [project_idx, node_id, decision_tree_id]
  );
};