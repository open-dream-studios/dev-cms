// project/src/types/jobs.ts
export type JobStatusOption =
  | "work_required"
  | "waiting_parts"
  | "waiting_customer"
  | "complete"
  | "cancelled";

export type Job = {
  id?: number | null;
  job_id: string | null;
  product_id: number;
  job_definition_id: number;
  status: JobStatusOption;
  priority: string;
  scheduled_date: string | null;
  completed_date: string | null;
  notes: string | null;
};

export type JobDefinition = {
  id?: number | null;
  definition_id: string | null;
  type: string;
  description: string;
  hours_required: number;
};
