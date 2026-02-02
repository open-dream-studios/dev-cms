// server/handlers/modules/estimations/if_trees/decision_tree_validator.ts
import type { PoolConnection } from "mysql2/promise";
import { resolveExpressionType } from "./expression_type_resolver.js";

export const validateDecisionTree = async (
  conn: PoolConnection,
  project_idx: number,
  decision_tree_id: number,
  allowedVariableKeys: string[] | Set<string> | undefined
) => {
  const allowedKeys =
    allowedVariableKeys instanceof Set
      ? allowedVariableKeys
      : new Set(allowedVariableKeys ?? []);

  const [[tree]] = await conn.query<any[]>(
    `SELECT * FROM estimation_if_decision_trees WHERE id = ?`,
    [decision_tree_id]
  );
  if (!tree) throw new Error("Decision tree not found");

  const [branches] = await conn.query<any[]>(
    `SELECT * FROM estimation_if_decision_branches
     WHERE decision_tree_id = ?
     ORDER BY order_index ASC`,
    [decision_tree_id]
  );

  if (!branches.length) {
    throw new Error("Decision tree must have branches");
  }

  let hasElse = false;

  for (const branch of branches) {
    if (branch.condition_expression_id) {
      const condType = await resolveExpressionType(
        conn,
        project_idx,
        branch.condition_expression_id,
        allowedKeys
      );
      if (condType !== "boolean") {
        throw new Error("Condition must resolve to boolean");
      }
    } else {
      hasElse = true;
    }

    if (tree.return_type === "number") {
      const [[ret]] = await conn.query<any[]>(
        `SELECT * FROM estimation_if_decision_return_number WHERE branch_id = ?`,
        [branch.id]
      );
      if (!ret) throw new Error("Missing numeric return");

      const retType = await resolveExpressionType(
        conn,
        project_idx,
        ret.value_expression_id,
        allowedKeys
      );
      if (retType !== "number") {
        throw new Error("Return expression must be number");
      }
    }

    if (tree.return_type === "node") {
      const [[ret]] = await conn.query<any[]>(
        `SELECT * FROM estimation_if_decision_return_node WHERE branch_id = ?`,
        [branch.id]
      );
      if (!ret) throw new Error("Missing node return");
    }

    if (tree.return_type === "boolean") {
      const [[ret]] = await conn.query<any[]>(
        `SELECT * FROM estimation_if_decision_return_boolean WHERE branch_id = ?`,
        [branch.id]
      );
      if (!ret) throw new Error("Missing boolean return");

      const retType = await resolveExpressionType(
        conn,
        project_idx,
        ret.value_expression_id,
        allowedKeys
      );

      if (retType !== "boolean") {
        throw new Error("Boolean return must resolve to boolean");
      }
    }

    if (tree.return_type === "adjustment") {
      const [rets] = await conn.query<any[]>(
        `SELECT * FROM estimation_if_decision_return_adjustments WHERE branch_id = ?`,
        [branch.id]
      );
      if (!rets.length)
        throw new Error("Adjustment branch must return commands");

      for (const r of rets) {
        const valType = await resolveExpressionType(
          conn,
          project_idx,
          r.value_expression_id,
          allowedKeys
        );
        if (valType !== "number") {
          throw new Error("Adjustment value must be number");
        }
      }
    }
  }

  if (!hasElse) {
    throw new Error("Decision tree must include ELSE branch");
  }
};
