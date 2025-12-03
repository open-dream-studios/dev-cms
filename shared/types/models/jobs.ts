// shared/types/models/jobs.ts
export type JobStatusOption =
  | "waiting_diagnosis"
  | "waiting_work"
  | "waiting_parts"
  | "waiting_listing"
  | "listed"
  | "waiting_customer"
  | "waiting_delivery"
  | "complete"
  | "delivered"
  | "cancelled";

export type PriorityOption = "low" | "medium" | "high" | "urgent";

export type Job = {
  id?: number;
  job_id: string | null;
  job_definition_id: number | null;
  product_id: number | null;
  customer_id: number | null;
  valuation: number | null;
  status: JobStatusOption;
  priority: PriorityOption;
  scheduled_start_date: string | Date | null;
  completed_date: string | Date | null;
  notes: string | null;
  updated_at?: string | Date | null;
};

export type JobDefinition = {
  id?: number;
  job_definition_id: string | null;
  type: string;
  description: string | null;
};

export type TaskStatusOption =
  | "waiting_work"
  | "waiting_parts"
  | "waiting_customer"
  | "complete"
  | "cancelled";

export type Task = {
  id?: number;
  task_id: string | null;
  job_id: number | null;
  status: TaskStatusOption;
  priority: PriorityOption;
  scheduled_start_date: string | Date | null;
  task: string | null;
  description: string | null;
  updated_at?: string | Date | null;
};
