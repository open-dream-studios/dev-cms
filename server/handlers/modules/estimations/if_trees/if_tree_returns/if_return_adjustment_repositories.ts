// server/handlers/modules/estimations/if_trees/if_tree_returns/if_return_adjustment_repositories.ts
import type { PoolConnection } from "mysql2/promise";

export const upsertReturnAdjustmentRepo = async (
  conn: PoolConnection,
  body: any
) => {
  const OP_MAP: Record<string, string> = {
    "+=": "add",
    "-=": "subtract",
    "*=": "multiply",
  };

  const { branch_id, order_index, operation, value_expression_id } = body;
  await conn.query(
    `
    INSERT INTO estimation_if_decision_return_adjustments
      (branch_id, order_index, operation, value_expression_id)
    VALUES (?, ?, ?, ?)
    `,
    [branch_id, order_index, OP_MAP[operation], value_expression_id]
  );
  return { success: true };
};
