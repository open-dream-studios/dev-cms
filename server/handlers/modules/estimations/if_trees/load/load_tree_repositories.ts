// server/handlers/modules/estimations/if_trees/load/load_tree_repositories.ts
import type { PoolConnection } from "mysql2/promise";

export const getIfTreeRepo = async (
  conn: PoolConnection,
  decision_tree_id: number
) => {
  const [[tree]] = await conn.query<any[]>(
    `SELECT return_type FROM estimation_if_decision_trees WHERE id = ?`,
    [decision_tree_id]
  );

  if (!tree) throw new Error("Decision tree not found");

  let returnJoin = "";
  let returnSelect = "";

  if (tree.return_type === "number") {
    returnJoin = `
      LEFT JOIN estimation_if_decision_return_number r
        ON r.branch_id = b.id
    `;
    returnSelect = `r.value_expression_id`;
  }

  if (tree.return_type === "boolean") {
    returnJoin = `
      LEFT JOIN estimation_if_decision_return_boolean r
        ON r.branch_id = b.id
    `;
    returnSelect = `r.value_expression_id`;
  }

  if (tree.return_type === "node") {
    returnJoin = `
      LEFT JOIN estimation_if_decision_return_node r
        ON r.branch_id = b.id
    `;
    returnSelect = `r.node_id`;
  }

  const [branches] = await conn.query<any[]>(
    `
    SELECT
      b.id AS branch_id,
      b.order_index,
      b.condition_expression_id,
      ${returnSelect} AS value_expression_id
    FROM estimation_if_decision_branches b
    ${returnJoin}
    WHERE b.decision_tree_id = ?
    ORDER BY b.order_index ASC
    `,
    [decision_tree_id]
  );

  const exprIds = new Set<number>();

  for (const b of branches) {
    if (b.condition_expression_id) exprIds.add(b.condition_expression_id);
    if (b.value_expression_id) exprIds.add(b.value_expression_id);
  }

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

  return { decision_tree_id, branches, expressions };
};