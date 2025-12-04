export type UpdateStatus = "requested" | "upcoming" | "in_progress" | "completed";
export type UpdatePriority = "low" | "medium" | "high";

export interface UpdateBase {
  project_idx: number;
  update_id: string;
  title: string;
  description: string | null;
  requested_by: string | null;
  assignee: string | null;
  status: UpdateStatus;
  priority: UpdatePriority;
  created_at: string | null;
  completed_at: string | null;
}

export interface Update extends UpdateBase {
  id: number; // DB numeric primary key
}

export type UpdateInput = Partial<UpdateBase> & {
  id?: number | null;
  update_id?: string | null; // required for upsert
};

export type UpdateUpdate = Partial<UpdateBase> & {
  update_id: string; // always specify which one to edit
};