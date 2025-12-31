// src/api/jobDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import { JobDefinition } from "@open-dream/shared";

export async function fetchJobDefinitionsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/jobs/get-definitions", {
    project_idx,
  });
  return res.data.jobDefinitions || [];
}

export async function upsertJobDefinitionApi(
  project_idx: number,
  definition: JobDefinition
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/jobs/upsert-definition", {
    ...definition,
    project_idx,
  });
  return res.data;
}

export async function deleteJobDefinitionApi(
  project_idx: number,
  job_definition_id: string
) {
  if (!project_idx) return null;
  await makeRequest.post("/jobs/delete-definition", {
    job_definition_id,
    project_idx,
  });
}
