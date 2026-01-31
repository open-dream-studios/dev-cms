// export type Value =
//   | { kind: "number"; value: number }
//   | { kind: "variable"; key?: string }
//   | { kind: "statement" };

// export type Condition = {
//   left: Value;
//   operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "AND" | "OR";
//   right: Value;
// };

// export type Branch =
//   | {
//       type: "return";
//       value: Value;
//     }
//   | {
//       type: "if";
//       condition: Condition;
//       then: Branch;
//       else: Branch;
//     };

export type Value =
  | { kind: "number"; value: number }
  | { kind: "variable" }
  | { kind: "statement" };

export type Condition = {
  left: Value;
  operator: "==" | ">=" | "<=" | "AND" | "OR";
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