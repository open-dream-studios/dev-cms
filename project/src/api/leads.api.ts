// project/src/api/leads.api.ts
import { makeRequest } from "@/util/axios";
import { Lead, LeadInput } from "@open-dream/shared";

export async function fetchLeadsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/leads", {
    project_idx,
  });
  const leads: Lead[] = res.data.leads;
  return leads;
}

export async function upsertLeadApi(
  project_idx: number,
  lead: LeadInput
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/leads/upsert", {
    ...lead,
    project_idx,
  });
  return {
    id: res.data.id,
    lead_id: res.data.lead_id,
  };
}

export async function deleteLeadApi(
  project_idx: number,
  lead_id: string
) {
  if (!project_idx) return null;
  await makeRequest.post("/leads/delete", {
    lead_id,
    project_idx,
  });
}