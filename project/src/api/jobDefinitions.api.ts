// src/api/jobDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import { JobDefinition } from "@open-dream/shared";

export async function fetchJobDefinitionsApi(projectId: number) {
  const res = await makeRequest.post("/api/jobs/get-definitions", {
    project_idx: projectId,
  });
  return res.data.jobDefinitions || [];
}

export async function upsertJobDefinitionApi(
  projectId: number,
  definition: JobDefinition
) {
  if (!projectId) throw new Error("No project selected");
  const res = await makeRequest.post("/api/jobs/upsert-definition", {
    ...definition,
    project_idx: projectId,
  });
  return res.data;
}

export async function deleteJobDefinitionApi(
  projectId: number,
  definitionId: string
) {
  await makeRequest.post("/api/jobs/delete-definition", {
    job_definition_id: definitionId,
    project_idx: projectId,
  });
}
