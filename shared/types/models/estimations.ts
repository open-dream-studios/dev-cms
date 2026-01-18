
// shared/types/models/estimation.ts
export type EstimationGraphType = "decision" | "pricing";
export type EstimationGraphStatus = "draft" | "published" | "archived";

export type EstimationGraph = {
  id: number;
  graph_id: string;
  project_idx: number;
  graph_type: EstimationGraphType;
  name: string;
  status: EstimationGraphStatus;
  version: number;
  created_at: string;
  updated_at: string;
};

export type EstimationNodeType = "question" | "cost";

export type FactType = "boolean" | "number" | "string" | "enum";

export type EstimationFactDefinition = {
  id: number;
  fact_id: string;
  project_idx: number;
  fact_key: string;
  fact_type: FactType;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProducesFact = {
  fact_key: string;
  value: any; // can be "{{answer}}" or constant
};

export type QuestionNodeConfig = {
  prompt: string;
  input_type: "text" | "number" | "boolean" | "select";
  options?: { label: string; value: string }[];
  produces_facts: ProducesFact[];
  validation_rules?: any;
  visibility_rules?: any;
};

export type CostNodeConfig = {
  applies_if: any;
  cost_range: { min: any; max: any };
  formula?: { min: any; max: any };
  explanation_template?: string;
};

export type EstimationGraphNode = {
  id: number;
  node_id: string;
  graph_idx: number;
  node_type: EstimationNodeType;
  label: string;
  config: QuestionNodeConfig | CostNodeConfig | any;
  position: any | null;
  created_at: string;
  updated_at: string;
};

export type EstimationGraphEdge = {
  id: number;
  edge_id: string;
  graph_idx: number;
  from_node_idx: number;
  to_node_idx: number;
  edge_condition: any;
  created_at: string;
  updated_at: string;
};