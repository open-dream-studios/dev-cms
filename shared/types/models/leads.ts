// shared/types/models/lead.ts

export type LeadType = "product" | "service";

export type LeadStatus =
  | "new"
  | "followup_suggested"
  | "waiting_response"
  | "converted"
  | "on_hold"
  | "lost";

export interface LeadBase {
  project_idx: number;
  customer_id: string;
  lead_type: LeadType;
  product_id: string | null;
  job_definition_id: string | null;
  status: LeadStatus;
  notes: string | null;
  source: string | null;
}

export interface Lead extends LeadBase {
  id: number;
  lead_id: string;
  created_at: string;
  updated_at: string;
}

export interface LeadInput extends LeadBase {
  lead_id: string | null;
}