// project/src/api/estimation/estimationFactDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import {
  EstimationFactDefinition, 
  EstimationFactFolder,
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


// -------- FOLDERS --------
export async function fetchFactFoldersApi(project_idx: number, process_id: number) {
  const res = await makeRequest.post(
    "/estimations/fact-definitions/folders",
    { project_idx, process_id }
  );
  return res.data.folders as EstimationFactFolder[];
}

export async function upsertFactFoldersApi(
  project_idx: number,
  folders: {
    folder_id?: string | null;
    parent_folder_id?: number | null;
    name: string;
    ordinal?: number | null;
    process_id: number;
  }[]
) {
  const res = await makeRequest.post(
    "/estimations/fact-definitions/folders/upsert",
    { project_idx, folders }
  );
  return res.data;
}

export async function deleteFactFolderApi(
  project_idx: number,
  folder_id: string
) {
  await makeRequest.post(
    "/estimations/fact-definitions/folders/delete",
    { project_idx, folder_id }
  );
  return { success: true };
}

export async function reorderFactFoldersApi(
  project_idx: number,
  payload: {
    process_id: number;
    parent_folder_id?: number | null;
    orderedIds: string[];  
  }
) {
  const res = await makeRequest.post(
    "/estimations/fact-definitions/folders/reorder",
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