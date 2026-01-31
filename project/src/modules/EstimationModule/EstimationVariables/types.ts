// project/src/nodes/EstimationModule/EstimationVariables/types.ts
export type Value =
  | { kind: "literal"; value: string; selector_id: string }
  | { kind: "variable"; var_key: string; var_id: string | number; selector_id: string }
  | { kind: "statement"; expression_id?: number; selector_id: string }
  | { kind: "boolean"; value: boolean; selector_id: string };

export type Condition = {
  left: Value;
  operator: "==" | ">" | "<" | ">=" | "<=" | "AND" | "OR";
  right: Value;
};

export type IfCase = {
  condition: Condition;
  then: Branch;
};

export type Branch =
  | {
      type: "return";
      value: Value;
    }
  | {
      type: "if";
      cases: IfCase[]; // IF / ELSE IF / ELSE IF ...
      else: Branch; // single ELSE
    };