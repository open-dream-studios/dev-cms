// server/handlers/modules/estimations/if_trees/if_return_number_repositories.ts
import type { PoolConnection } from "mysql2/promise";

export const insertReturnNumber = async (
  conn: PoolConnection,
  branch_id: number,
  value_expression_id: number
) => {
  await conn.query(
    `
    INSERT INTO estimation_if_decision_return_number
    (branch_id, value_expression_id)
    VALUES (?, ?)
    `,
    [branch_id, value_expression_id]
  );
};