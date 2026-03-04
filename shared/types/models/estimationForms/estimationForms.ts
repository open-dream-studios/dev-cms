// shared/types/models/estimationForms/estimationForms.ts

export type EstimationNodeKind = "form" | "choice" | "const";

export type EstimationNodeId = string;
export type EstimationFormId = string;
export type EstimationRunId = string;

export type EstimationNodePath = EstimationNodeId[];

export type EstimationBaseNode = {
  id: EstimationNodeId;
  kind: EstimationNodeKind;
};

export type EstimationFormNode = EstimationBaseNode & {
  kind: "form";
  name: string;
  children: EstimationNode[];
};

export type EstimationChoiceNode = EstimationBaseNode & {
  kind: "choice";
  name: string;
  // Each case is a form so every option is a full sub-route.
  cases: EstimationFormNode[];
};

export type EstimationConstNode = EstimationBaseNode & {
  kind: "const";
  value: number;
  name?: string;
};

export type EstimationNode =
  | EstimationFormNode
  | EstimationChoiceNode
  | EstimationConstNode;

export type EstimationFormGraph = EstimationFormNode;

export type EstimationFormStatus = "draft" | "published" | "archived";

export type EstimationFormDefinition = {
  id: EstimationFormId;
  name: string;
  version: number;
  status: EstimationFormStatus;
  root: EstimationFormGraph;
  created_at: string;
  updated_at: string;
};

export type EstimationChoiceAnswer = {
  choice_node_id: EstimationNodeId;
  selected_case_form_id: EstimationNodeId;
};

export type EstimationResolvedConst = {
  const_node_id: EstimationNodeId;
  path: EstimationNodePath;
  value: number;
  name?: string;
};

export type EstimationRunStatus = "in_progress" | "completed" | "invalid";

export type EstimationFormRun = {
  id: EstimationRunId;
  form_id: EstimationFormId;
  form_version: number;
  status: EstimationRunStatus;
  answers: EstimationChoiceAnswer[];
  resolved_consts: EstimationResolvedConst[];
  total: number;
  started_at: string;
  completed_at: string | null;
};

export type EstimationRunInput = {
  form: EstimationFormGraph;
  // Map: choice node id -> selected case form id
  selected_case_by_choice_id: Record<EstimationNodeId, EstimationNodeId>;
};

export type EstimationValidationErrorCode =
  | "root_must_be_form"
  | "empty_form"
  | "duplicate_node_id"
  | "choice_without_cases"
  | "invalid_choice_case"
  | "non_const_leaf"
  | "missing_choice_answer"
  | "invalid_choice_answer";

export type EstimationValidationError = {
  code: EstimationValidationErrorCode;
  node_id?: EstimationNodeId;
  path?: EstimationNodePath;
  message: string;
};

export type EstimationValidationResult = {
  valid: boolean;
  errors: EstimationValidationError[];
};

export type EstimationExecutionResult = {
  resolved_consts: EstimationResolvedConst[];
  total: number;
  visited_node_ids: EstimationNodeId[];
};
