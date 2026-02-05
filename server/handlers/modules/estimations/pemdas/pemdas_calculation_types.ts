// server/handlers/modules/estimations/pemdas/pemdas_calculation_types.ts

export type CostBreakdown = {
  labor: number;
  materials: number;
  misc: number;
  total: number;
};

export type ContributorResult = {
  node_id: string;
  label: string;
  breakdown: CostBreakdown;
  children: ContributorResult[];
};

export type RuntimeContext = {
  factInputs: Record<string, string | number>;
  expressionCache: Map<number, any>;
  variableCache: Map<string, number>;
  decisionTrees: Map<number, any>;
  expressions: Map<number, any>;
  variableBindings: Map<string, number>; // var_key → decision_tree_id
};

export type EvalValue =
  | { kind: "scalar"; value: number }
  | { kind: "cost"; breakdown: CostBreakdown };