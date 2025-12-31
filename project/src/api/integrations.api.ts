// src/api/integrations.api.ts
import { makeRequest } from "@/util/axios";
import { Integration } from "@open-dream/shared";

export async function fetchProjectIntegrationsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.get("/integrations", {
    params: { project_idx },
  });
  return res.data.integrations || ([] as Integration[]);
}

export async function upsertProjectIntegrationApi(
  project_idx: number,
  integration: Integration
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/integrations/upsert", {
    ...integration,
    project_idx,
  });
  return res.data;
}

export async function deleteProjectIntegrationApi(
  project_idx: number,
  integration_id: string
) {
  if (!project_idx) return null;
  await makeRequest.post("/integrations/delete", {
    integration_id,
    project_idx,
  });
}
