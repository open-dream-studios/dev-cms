export interface ProjectCall {
  id?: number;
  project_idx: number;
  call_id: string | null;
  aircall_call_id: number;
  call_uuid?: string | null;
  direction?: string | null;
  from_number?: string | null;
  to_number?: string | null;
  started_at?: Date | null;
  ended_at?: Date | null;
  duration?: number | null;
  status?: string | null;
  agent_id?: number | null;
  agent_name?: string | null;
  agent_email?: string | null;
  hangup_cause?: string | null;
  recording_url?: string | null;
  signed_recording_url?: string | null;
  transcription?: any | null;
  aircall_direct_link?: string | null;
  created_at?: Date;
}
