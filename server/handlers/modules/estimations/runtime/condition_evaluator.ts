// server/handlers/modules/estimations/runtime/condition_evaluator.ts
type Facts = Record<string, any>;

export const evaluateCondition = (
  condition: any,
  facts: Facts
): boolean => {
  if (!condition || Object.keys(condition).length === 0) {
    return true;
  }

  if (condition.and) {
    return condition.and.every((c: any) =>
      evaluateCondition(c, facts)
    );
  }

  if (condition.or) {
    return condition.or.some((c: any) =>
      evaluateCondition(c, facts)
    );
  }

  if (condition.equals) {
    const { fact, value } = condition.equals;
    return facts[fact] === value;
  }

  if (condition.gt) {
    const { fact, value } = condition.gt;
    return facts[fact] > value;
  }

  if (condition.lt) {
    const { fact, value } = condition.lt;
    return facts[fact] < value;
  }

  if (condition.in) {
    const { fact, values } = condition.in;
    return values.includes(facts[fact]);
  }

  throw new Error(`Unsupported condition: ${JSON.stringify(condition)}`);
};