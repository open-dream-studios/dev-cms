// server/handlers/modules/estimations/runtime/expression_evaluator.ts
type Facts = Record<string, any>;

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const evaluateExpression = (expression: any, facts: Facts): any => {
  // literal
  if (
    typeof expression === "number" ||
    typeof expression === "boolean" ||
    typeof expression === "string"
  ) {
    return expression;
  }

  // null/undefined literal passthrough
  if (expression === null || expression === undefined) return expression;

  // fact reference: { fact: "square_feet" }
  if (expression.fact) {
    return facts[expression.fact];
  }

  // exists: { exists: { fact: "square_feet" } }
  if (expression.exists) {
    const k = expression.exists.fact;
    return facts[k] !== undefined && facts[k] !== null;
  }

  // coalesce: { coalesce: [ {fact:"square_feet"}, 60 ] }
  if (expression.coalesce) {
    for (const e of expression.coalesce) {
      const v = evaluateExpression(e, facts);
      if (v !== undefined && v !== null) return v;
    }
    return null;
  }

  // if: { if: { cond: <expr>, then: <expr>, else: <expr> } }
  if (expression.if) {
    const cond = Boolean(evaluateExpression(expression.if.cond, facts));
    return cond
      ? evaluateExpression(expression.if.then, facts)
      : evaluateExpression(expression.if.else, facts);
  }

  // arithmetic
  if (expression.add) {
    return expression.add.reduce(
      (sum: number, e: any) => sum + num(evaluateExpression(e, facts)),
      0
    );
  }

  if (expression.subtract) {
    const [a, b] = expression.subtract;
    return num(evaluateExpression(a, facts)) - num(evaluateExpression(b, facts));
  }

  if (expression.multiply) {
    return expression.multiply.reduce(
      (prod: number, e: any) => prod * num(evaluateExpression(e, facts)),
      1
    );
  }

  if (expression.divide) {
    const [a, b] = expression.divide;
    const denom = num(evaluateExpression(b, facts));
    if (denom === 0) return 0;
    return num(evaluateExpression(a, facts)) / denom;
  }

  if (expression.min) {
    const vals = expression.min.map((e: any) => num(evaluateExpression(e, facts)));
    return Math.min(...vals);
  }

  if (expression.max) {
    const vals = expression.max.map((e: any) => num(evaluateExpression(e, facts)));
    return Math.max(...vals);
  }

  if (expression.clamp) {
    const v = num(evaluateExpression(expression.clamp.value, facts));
    const lo = num(evaluateExpression(expression.clamp.min, facts));
    const hi = num(evaluateExpression(expression.clamp.max, facts));
    return Math.max(lo, Math.min(hi, v));
  }

  // comparisons -> boolean output
  if (expression.gt) {
    const a = evaluateExpression(expression.gt.a, facts);
    const b = evaluateExpression(expression.gt.b, facts);
    return num(a) > num(b);
  }

  if (expression.gte) {
    const a = evaluateExpression(expression.gte.a, facts);
    const b = evaluateExpression(expression.gte.b, facts);
    return num(a) >= num(b);
  }

  if (expression.lt) {
    const a = evaluateExpression(expression.lt.a, facts);
    const b = evaluateExpression(expression.lt.b, facts);
    return num(a) < num(b);
  }

  if (expression.lte) {
    const a = evaluateExpression(expression.lte.a, facts);
    const b = evaluateExpression(expression.lte.b, facts);
    return num(a) <= num(b);
  }

  if (expression.equals) {
    const a = evaluateExpression(expression.equals.a, facts);
    const b = evaluateExpression(expression.equals.b, facts);
    // loose equality is sometimes useful for numeric strings
    // but keep strict if you prefer
    return a == b;
  }

  if (expression.not_equals) {
    const a = evaluateExpression(expression.not_equals.a, facts);
    const b = evaluateExpression(expression.not_equals.b, facts);
    return a != b;
  }

  // boolean logic
  if (expression.and) {
    return expression.and.every((e: any) => Boolean(evaluateExpression(e, facts)));
  }

  if (expression.or) {
    return expression.or.some((e: any) => Boolean(evaluateExpression(e, facts)));
  }

  if (expression.not) {
    return !Boolean(evaluateExpression(expression.not, facts));
  }

  throw new Error(`Unsupported expression: ${JSON.stringify(expression)}`);
};