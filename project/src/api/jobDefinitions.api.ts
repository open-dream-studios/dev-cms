// src/api/jobDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import { JobDefinition } from "@open-dream/shared";

export async function fetchJobDefinitionsApi(project_idx: number) {
  const res = await makeRequest.post("/api/jobs/get-definitions", {
    project_idx,
  });
  return res.data.jobDefinitions || [];
}

export async function upsertJobDefinitionApi(
  project_idx: number,
  definition: JobDefinition
) {
  const res = await makeRequest.post("/api/jobs/upsert-definition", {
    ...definition,
    project_idx,
  });
  return res.data;
}

export async function deleteJobDefinitionApi(
  project_idx: number,
  job_definition_id: string
) {
  await makeRequest.post("/api/jobs/delete-definition", {
    job_definition_id,
    project_idx,
  });
}
