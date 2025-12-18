// src/api/integrations.api.ts
import { makeRequest } from "@/util/axios";
import { Integration } from "@open-dream/shared";

export async function fetchProjectIntegrationsApi(project_idx: number) {
  const res = await makeRequest.get("/api/integrations", {
    params: { project_idx },
  });
  return res.data.integrations || ([] as Integration[]);
}

export async function upsertProjectIntegrationApi(
  project_idx: number,
  integration: Integration
) {
  const res = await makeRequest.post("/api/integrations/upsert", {
    ...integration,
    project_idx,
  });
  return res.data;
}

export async function deleteProjectIntegrationApi(
  project_idx: number,
  integration_id: string
) {
  await makeRequest.post("/api/integrations/delete", {
    integration_id,
    project_idx,
  });
}
