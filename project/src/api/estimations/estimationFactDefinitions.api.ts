// project/src/api/estimation/estimationFactDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import { EstimationFactDefinition, FactType } from "@open-dream/shared";

export async function fetchFactDefinitionsApi(project_idx: number) {
  const res = await makeRequest.post("/estimations/fact-definitions", {
    project_idx,
  });
  return res.data.fact_definitions as EstimationFactDefinition[];
}

export async function upsertFactDefinitionApi(
  project_idx: number,
  payload: {
    fact_id?: string | null;
    fact_key: string;
    fact_type: FactType;
    description?: string | null;
  }
) {
  const res = await makeRequest.post("/estimations/fact-definitions/upsert", {
    project_idx,
    ...payload,
  });
  return { fact_id: res.data.fact_id as string };
}

export async function deleteFactDefinitionApi(
  project_idx: number,
  fact_id: string
) {
  await makeRequest.post("/estimations/fact-definitions/delete", {
    project_idx,
    fact_id,
  });
  return { success: true };
}
