// server/handlers/modules/estimations/if_trees/if_branch_repositories.ts
import type { PoolConnection } from "mysql2/promise";

export const upsertBranchFunction = async (
  conn: PoolConnection,
  tree_id: number,
  order_index: number,
  condition_expression_id: number | null
) => {
  const q = `
    INSERT INTO estimation_if_decision_branches
    (decision_tree_id, order_index, condition_expression_id)
    VALUES (?, ?, ?)
  `;
  await conn.query(q, [tree_id, order_index, condition_expression_id]);
};

export const reorderBranchesFunction = async (
  conn: PoolConnection,
  orderedIds: number[]
) => {
  for (let i = 0; i < orderedIds.length; i++) {
    await conn.query(
      `UPDATE estimation_if_decision_branches SET order_index = ? WHERE id = ?`,
      [i, orderedIds[i]]
    );
  }
};

export const deleteBranchFunction = async (
  conn: PoolConnection,
  id: number
) => {
  await conn.query(
    `DELETE FROM estimation_if_decision_branches WHERE id = ?`,
    [id]
  );
  return { success: true };
};