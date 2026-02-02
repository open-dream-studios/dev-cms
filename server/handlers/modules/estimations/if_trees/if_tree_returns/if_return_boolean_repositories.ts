// server/handlers/modules/estimations/if_trees/returns/if_return_boolean_repositories.ts
import type { PoolConnection } from "mysql2/promise";

export const upsertReturnBooleanRepo = async (
  conn: PoolConnection,
  branch_id: number,
  value_expression_id: number
) => {
  await conn.query(
    `
    INSERT INTO estimation_if_decision_return_boolean
      (branch_id, value_expression_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE
      value_expression_id = VALUES(value_expression_id)
    `,
    [branch_id, value_expression_id]
  );

  return { success: true };
};