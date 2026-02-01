import type { PoolConnection } from "mysql2/promise";

export const getIfTreeForVariableRepo = async (
  conn: PoolConnection,
  decision_tree_id: number
) => {
  const [branches] = await conn.query<any[]>(
    `
    SELECT
      b.id AS branch_id,
      b.order_index,
      b.condition_expression_id,
      r.value_expression_id
    FROM estimation_if_decision_branches b
    JOIN estimation_if_decision_return_number r
      ON r.branch_id = b.id
    WHERE b.decision_tree_id = ?
    ORDER BY b.order_index ASC
    `,
    [decision_tree_id]
  );

  const exprIds = new Set<number>();
  branches.forEach((b) => {
    if (b.condition_expression_id) exprIds.add(b.condition_expression_id);
    exprIds.add(b.value_expression_id);
  });

  const [expressions] = exprIds.size
    ? await conn.query<any[]>(
        `
      WITH RECURSIVE expr_tree AS (
        SELECT *
        FROM estimation_if_expression_nodes
        WHERE id IN (?)

        UNION ALL

        SELECT e.*
        FROM estimation_if_expression_nodes e
        JOIN expr_tree t
          ON e.id = t.left_child_id
          OR e.id = t.right_child_id
      )
      SELECT DISTINCT *
      FROM expr_tree
      `,
        [[...exprIds]]
      )
    : [[]];

  return { branches, expressions };
};
