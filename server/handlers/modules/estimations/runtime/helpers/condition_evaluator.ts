// server/handlers/modules/estimations/runtime/helpers/condition_evaluator.ts

type Facts = Record<string, any>;

const resolveValue = (v: any, facts: Facts) => {
  if (v && typeof v === "object" && "fact" in v) {
    return facts[v.fact];
  }
  return v;
};

export const evaluateCondition = (
  condition: any,
  facts: Facts
): boolean => {
  if (!condition || Object.keys(condition).length === 0) {
    return true;
  }

  // AND
  if (Array.isArray(condition.and)) {
    return condition.and.every((c: any) =>
      evaluateCondition(c, facts)
    );
  }

  // OR
  if (Array.isArray(condition.or)) {
    return condition.or.some((c: any) =>
      evaluateCondition(c, facts)
    );
  }

  // EQUALS (graph format)
  if (condition.equals) {
    const a = resolveValue(condition.equals.a, facts);
    const b = resolveValue(condition.equals.b, facts);
    return a === b;
  }

  // GT
  if (condition.gt) {
    const a = resolveValue(condition.gt.a, facts);
    const b = resolveValue(condition.gt.b, facts);
    return a > b;
  }

  // LT
  if (condition.lt) {
    const a = resolveValue(condition.lt.a, facts);
    const b = resolveValue(condition.lt.b, facts);
    return a < b;
  }

  // IN
  if (condition.in) {
    const a = resolveValue(condition.in.a, facts);
    const b = resolveValue(condition.in.b, facts);
    return Array.isArray(b) && b.includes(a);
  }

  throw new Error(
    `Unsupported condition shape: ${JSON.stringify(condition)}`
  );
};