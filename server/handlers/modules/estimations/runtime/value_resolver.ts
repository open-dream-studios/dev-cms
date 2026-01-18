// server/handlers/modules/estimations/runtime/value_resolver.ts
import { evaluateExpression } from "./expression_evaluator.js";

export const resolveProducedValue = (
  f: any,
  answer: any,
  facts: Record<string, any>
) => {
  if (f.value === "{{answer}}") {
    return answer;
  }

  if (f.value_expr) {
    return evaluateExpression(f.value_expr, {
      ...facts,
      answer,
    });
  }

  if ("value" in f) {
    return f.value;
  }

  throw new Error(`Invalid produces_facts entry: ${JSON.stringify(f)}`);
};