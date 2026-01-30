// server/handlers/modules/estimations/if_trees/if_expression_repositories.ts
import type { PoolConnection } from "mysql2/promise";

export const upsertExpressionNode = async (
  conn: PoolConnection,
  project_idx: number,
  node: any
) => {
  const {
    id,
    node_type,
    number_value,
    string_value,
    boolean_value,
    ref_key,
    operator,
    function_name,
    left_child_id,
    right_child_id,
    extra_child_id
  } = node;

  const q = `
    INSERT INTO estimation_if_expression_nodes
    (id, project_idx, node_type, number_value, string_value, boolean_value,
     ref_key, operator, function_name, left_child_id, right_child_id, extra_child_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      node_type = VALUES(node_type),
      number_value = VALUES(number_value),
      string_value = VALUES(string_value),
      boolean_value = VALUES(boolean_value),
      ref_key = VALUES(ref_key),
      operator = VALUES(operator),
      function_name = VALUES(function_name),
      left_child_id = VALUES(left_child_id),
      right_child_id = VALUES(right_child_id),
      extra_child_id = VALUES(extra_child_id)
  `;

  await conn.query(q, [
    id ?? null,
    project_idx,
    node_type,
    number_value ?? null,
    string_value ?? null,
    boolean_value ?? null,
    ref_key ?? null,
    operator ?? null,
    function_name ?? null,
    left_child_id ?? null,
    right_child_id ?? null,
    extra_child_id ?? null
  ]);
};

export const deleteExpressionNode = async (
  conn: PoolConnection,
  project_idx: number,
  id: number
) => {
  await conn.query(
    `DELETE FROM estimation_if_expression_nodes
     WHERE id = ? AND project_idx = ?`,
    [id, project_idx]
  );

  return { success: true };
};