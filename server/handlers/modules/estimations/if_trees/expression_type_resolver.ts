// server/handlers/modules/estimations/if_trees/expression_type_resolver.ts
import type { PoolConnection } from "mysql2/promise";

export type ExprType = "number" | "boolean" | "string";

export const resolveExpressionType = async (
  conn: PoolConnection,
  project_idx: number,
  node_id: number,
  allowedVariableKeys: Set<string>
): Promise<ExprType> => {
  const [rows] = await conn.query<any[]>(
    `SELECT * FROM estimation_if_expression_nodes WHERE id = ?`,
    [node_id]
  );
  if (!rows.length) throw new Error("Expression node not found");

  const node = rows[0];

  switch (node.node_type) {
    case "const":
      if (node.number_value !== null) return "number";
      if (node.boolean_value !== null) return "boolean";
      return "string";

    case "fact_ref": {
      const [facts] = await conn.query<any[]>(
        `SELECT fact_type FROM estimation_fact_definitions
         WHERE project_idx = ? AND fact_key = ?`,
        [project_idx, node.ref_key]
      );
      if (!facts.length) throw new Error(`Unknown fact ${node.ref_key}`);
      return facts[0].fact_type === "number"
        ? "number"
        : facts[0].fact_type === "boolean"
        ? "boolean"
        : "string";
    }

    case "variable_ref": {
      if (!allowedVariableKeys.has(node.ref_key)) {
        throw new Error(`Illegal variable reference: ${node.ref_key}`);
      }
      return "number";
    }

    case "operator": {
      const leftType = node.left_child_id
        ? await resolveExpressionType(conn, project_idx, node.left_child_id, allowedVariableKeys)
        : null;
      const rightType = node.right_child_id
        ? await resolveExpressionType(conn, project_idx, node.right_child_id, allowedVariableKeys)
        : null;

      if (["+", "-", "*", "/"].includes(node.operator)) {
        if (leftType !== "number" || rightType !== "number") {
          throw new Error("Math operators require numbers");
        }
        return "number";
      }

      if (["==", "!=", "<", "<=", ">", ">="].includes(node.operator)) {
        if (leftType !== rightType) {
          throw new Error("Comparison operands must match types");
        }
        return "boolean";
      }

      if (["AND", "OR"].includes(node.operator)) {
        if (leftType !== "boolean" || rightType !== "boolean") {
          throw new Error("Boolean operators require booleans");
        }
        return "boolean";
      }

      if (node.operator === "NOT") {
        if (leftType !== "boolean") {
          throw new Error("NOT requires boolean");
        }
        return "boolean";
      }

      throw new Error(`Unknown operator ${node.operator}`);
    }

    case "function": {
      if (["min", "max"].includes(node.function_name)) {
        const l = await resolveExpressionType(conn, project_idx, node.left_child_id, allowedVariableKeys);
        const r = await resolveExpressionType(conn, project_idx, node.right_child_id, allowedVariableKeys);
        if (l !== "number" || r !== "number") {
          throw new Error(`${node.function_name} requires numbers`);
        }
        return "number";
      }

      if (node.function_name === "abs") {
        const l = await resolveExpressionType(conn, project_idx, node.left_child_id, allowedVariableKeys);
        if (l !== "number") throw new Error("abs requires number");
        return "number";
      }

      if (node.function_name === "clamp") {
        const l = await resolveExpressionType(conn, project_idx, node.left_child_id, allowedVariableKeys);
        const r = await resolveExpressionType(conn, project_idx, node.right_child_id, allowedVariableKeys);
        const e = await resolveExpressionType(conn, project_idx, node.extra_child_id, allowedVariableKeys);
        if (l !== "number" || r !== "number" || e !== "number") {
          throw new Error("clamp requires numbers");
        }
        return "number";
      }

      throw new Error(`Unknown function ${node.function_name}`);
    }

    default:
      throw new Error("Invalid expression node type");
  }
};