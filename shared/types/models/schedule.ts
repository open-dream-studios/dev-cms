export interface ScheduleRequestBase {
  project_idx: number;
  customer_id?: string | null;
  job_id?: string | null;
  source_type: "customer" | "internal" | "ai";
  source_user_id?: string | null;
  request_type: "create" | "update" | "delete";
  calendar_event_id?: string | null;
  proposed_start?: string | null; // ISO string
  proposed_end?: string | null;   // ISO string
  proposed_location?: string | null;
  status?: "pending" | "approved" | "rejected"; // default pending
  ai_reasoning?: string | null;
}

// Row as stored in DB (includes PK and timestamps)
export interface ScheduleRequest extends ScheduleRequestBase {
  id: number;
  schedule_request_id: string;
  created_at: string;  // ISO string
  updated_at: string;  // ISO string
  resolved_at?: string | null; // ISO string
}

// Input for creating/upserting
export interface ScheduleRequestInput extends ScheduleRequestBase {
  schedule_request_id?: string | null; // optional for new inserts
}