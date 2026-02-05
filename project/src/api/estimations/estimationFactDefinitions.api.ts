// project/src/api/estimation/estimationFactDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import {
  EstimationFactDefinition,  
  FactType,
} from "@open-dream/shared";

export async function fetchFactDefinitionsApi(project_idx: number, process_id: number) {
  const res = await makeRequest.post("/estimations/fact-definitions", {
    project_idx,
    process_id,
  });
  return res.data.fact_definitions as EstimationFactDefinition[];
}

export async function upsertFactDefinitionApi(
  project_idx: number,
  payload: {
    fact_id?: string | null;
    fact_key: string;
    fact_type: FactType;
    variable_scope: "fact" | "geometric" | "project";
    description?: string | null;
    folder_id?: number | null;
    process_id: number;
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

export async function reorderFactDefinitionsApi(
  project_idx: number,
  payload: {
    process_id: number;
    parent_folder_id?: number | null;
    orderedIds: string[]; // fact_id[]
  }
) {
  const res = await makeRequest.post(
    "/estimations/fact-definitions/reorder",
    {
      project_idx,
      ...payload,
    }
  );
  return res.data;
}

// -------- ENUM OPTIONS --------
export async function upsertEnumOptionApi(
  project_idx: number,
  payload: {
    fact_definition_idx: number;
    option: {
      option_id?: string;
      label: string;
      value: string;
      ordinal?: number;
    };
  }
) {
  const res = await makeRequest.post(
    "/estimations/fact-definitions/enum-options/upsert",
    { project_idx, ...payload }
  );
  return res.data;
}

export async function deleteEnumOptionApi(
  project_idx: number,
  option_id: string
) {
  await makeRequest.post(
    "/estimations/fact-definitions/enum-options/delete",
    { project_idx, option_id }
  );
  return { success: true };
}

export async function reorderEnumOptionsApi(
  project_idx: number,
  payload: {
    fact_definition_idx: number;
    orderedOptionIds: string[];
  }
) {
  const res = await makeRequest.post(
    "/estimations/fact-definitions/enum-options/reorder",
    { project_idx, ...payload }
  );
  return res.data;
}