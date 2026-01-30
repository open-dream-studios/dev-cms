export type Value =
  | { kind: "number"; value: number }
  | { kind: "node"; key?: string }
  | { kind: "statement" };

export type Condition = {
  left: Value;
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "AND" | "OR";
  right: Value;
};

export type Branch =
  | {
      type: "return";
      value: Value;
    }
  | {
      type: "if";
      condition: Condition;
      then: Branch;
      else: Branch;
    };