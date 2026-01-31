// shared/types/models/estimations/estimation.ts
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
export type VariableScope = "fact" | "geometric" | "project";

export type EstimationFactDefinition = {
  id: number;
  fact_id: string;
  project_idx: number;
  folder_id: number | null;
  process_id: number;
  variable_scope: VariableScope;
  ordinal: number;
  fact_key: string;
  fact_type: FactType;
  description: string | null;
  enum_options?: EstimationFactEnumOption[];
  created_at: string;
  updated_at: string;
};

export type EstimationFactFolder = {
  id: number;
  folder_id: string;
  project_idx: number;
  process_id: number;
  variable_scope?: VariableScope;
  parent_folder_id: number | null;
  name: string;
  ordinal: number;
  created_at: string;
  updated_at: string;
};

export type ProducesFact = {
  fact_key: string;
  value: any;
};

export type SelectOption = {
  id: string;
  label: string;
  value: string;
  visibility_rules?: any;
};

export type EstimationFactEnumOption = {
  id: number;
  option_id: string;
  fact_definition_idx: number;
  label: string;
  value: string;
  ordinal: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type SelectMode = "single" | "multi";
export type QuestionNodeConfig = {
  prompt: string;
  input_type: "text" | "number" | "boolean" | "select";
  required: boolean;
  select_mode?: SelectMode;
  options?: SelectOption[];
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
  execution_priority: number;
  created_at: string;
  updated_at: string;
};

export type EstimationRunStatus = "in_progress" | "completed" | "abandoned";

export type EstimationRun = {
  id: number;
  estimate_run_id: string;
  project_idx: number;
  decision_graph_idx: number;
  pricing_graph_idx: number;
  status: EstimationRunStatus;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};
