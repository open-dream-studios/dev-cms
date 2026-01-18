// server/handlers/modules/estimations/runtime/expression_evaluator.ts
type Facts = Record<string, any>;

export const evaluateExpression = (
  expression: any,
  facts: Facts
): any => {
  // literal
  if (
    typeof expression === "number" ||
    typeof expression === "boolean" ||
    typeof expression === "string"
  ) {
    return expression;
  }

  // fact reference
  if (expression.fact) {
    return facts[expression.fact];
  }

  // arithmetic
  if (expression.add) {
    return expression.add.reduce(
      (sum: number, e: any) => sum + Number(evaluateExpression(e, facts)),
      0
    );
  }

  if (expression.multiply) {
    return expression.multiply.reduce(
      (prod: number, e: any) => prod * Number(evaluateExpression(e, facts)),
      1
    );
  }

  // comparisons → BOOLEAN OUTPUT
  if (expression.gt) {
    const { fact, value } = expression.gt;
    return facts[fact] > value;
  }

  if (expression.gte) {
    const { fact, value } = expression.gte;
    return facts[fact] >= value;
  }

  if (expression.lt) {
    const { fact, value } = expression.lt;
    return facts[fact] < value;
  }

  if (expression.lte) {
    const { fact, value } = expression.lte;
    return facts[fact] <= value;
  }

  if (expression.equals) {
    const { fact, value } = expression.equals;
    return facts[fact] === value;
  }

  // boolean logic
  if (expression.and) {
    return expression.and.every((e: any) =>
      Boolean(evaluateExpression(e, facts))
    );
  }

  if (expression.or) {
    return expression.or.some((e: any) =>
      Boolean(evaluateExpression(e, facts))
    );
  }

  throw new Error(`Unsupported expression: ${JSON.stringify(expression)}`);
};