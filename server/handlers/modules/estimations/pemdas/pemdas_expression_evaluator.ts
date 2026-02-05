// server/handlers/modules/estimations/pemdas/pemdas_expression_evaluator.ts
import { RuntimeContext } from "./pemdas_calculation_types.js";

export const evalExpression = (exprId: number, ctx: RuntimeContext): any => {
  if (ctx.expressionCache.has(exprId)) {
    return ctx.expressionCache.get(exprId);
  }

  const expr = ctx.expressions.get(exprId);
  if (!expr) throw new Error(`Missing expression ${exprId}`);

  let result: any;

  switch (expr.node_type) {
    case "const":
      result =
        expr.number_value ?? expr.boolean_value ?? expr.string_value ?? null;
      break;

    case "fact_ref": {
      const val = ctx.factInputs[expr.ref_key]; 
      if (val === undefined) throw new Error(`Missing fact ${expr.ref_key}`);
      result = val;
      break;
    }

    case "variable_ref": {
      result = resolveVariable(expr.ref_key, ctx); 
      break;
    }

    case "operator": {
      const left = evalExpression(expr.left_child_id, ctx);
      const right = evalExpression(expr.right_child_id, ctx);

      switch (expr.operator) {
        case "+":
          result = left + right;
          break;
        case "-":
          result = left - right;
          break;
        case "*":
          result = left * right;
          break;
        case "/":
          result = right === 0 ? 0 : left / right;
          break;
        case "==":
          result = left === right; 
          break;
        case "!=":
          result = left !== right;
          break;
        case "<":
          result = left < right;
          break;
        case "<=":
          result = left <= right;
          break;
        case ">":
          result = left > right;
          break;
        case ">=":
          result = left >= right;
          break;
        case "AND":
          result = Boolean(left && right);
          break;
        case "OR":
          result = Boolean(left || right);
          break;
        default:
          throw new Error(`Unsupported operator ${expr.operator}`);
      }
      break;
    }

    default:
      throw new Error(`Unsupported expression node ${expr.node_type}`);
  }

  ctx.expressionCache.set(exprId, result);
  return result;
};

export const resolveVariable = (
  varKey: string,
  ctx: RuntimeContext
): number => {
  if (ctx.variableCache.has(varKey)) {
    return ctx.variableCache.get(varKey)!;
  }

  const treeId = ctx.variableBindings.get(varKey);
  if (!treeId) throw new Error(`Unbound variable ${varKey}`);

  const tree = ctx.decisionTrees.get(treeId); 
  if (!tree) throw new Error(`Missing decision tree ${treeId}`);

  for (const branch of tree.branches) {
    if (!branch.condition_expression_id) {
      const v = evalExpression(branch.value_expression_id, ctx);
      ctx.variableCache.set(varKey, v);
      return v;
    }

    const cond = evalExpression(branch.condition_expression_id, ctx);

    if (cond === true) {
      const v = evalExpression(branch.value_expression_id, ctx);
      ctx.variableCache.set(varKey, v);
      return v;
    }
  }

  throw new Error(`No return branch for variable ${varKey}`);
};
