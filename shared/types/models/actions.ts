// shared/types/models/actions.ts
export type ActionDefinitionBase = {
  project_idx: number;
  parent_action_definition_id: number | null;
  identifier: string;
  type: string | null;
  description: string | null;
};

export interface ActionDefinition extends ActionDefinitionBase {
  id: number;
  action_definition_id: string;
  created_at: string;
  updated_at: string;
}

export interface ActionDefinitionInput extends ActionDefinitionBase {
  action_definition_id: string | null;
}


export type ActionPriorityOption = "low" | "medium" | "high" | "urgent";

export type ActionStatusOption =
  | "open"
  | "on_hold"
  | "complete"
  | "cancelled"

export type ActionBase = {
  project_idx: number;
  job_id: string | null;
  customer_id: string | null;
  action_definition_id: string;
  status: ActionStatusOption;
  priority: ActionPriorityOption;
  scheduled_start_date: string | Date | null;
  completed_date: string | Date | null;
  title: string | null;
  description: string | null;
};

export interface Action extends ActionBase {
  id: number;
  action_id: string;
  created_at: string;
  updated_at: string;
}

export interface ActionInput extends ActionBase {
  action_id: string | null;
}