// project/src/api/estimationForms/estimationForms.api.ts
import { makeRequest } from "@/util/axios";
import type {
  EstimationFormDefinition,
  EstimationFormGraph,
  EstimationFormStatus,
  EstimationValidationResult,
} from "@open-dream/shared";

export type EstimationFormDefinitionRecord = EstimationFormDefinition & {
  description?: string;
};

export type UpsertEstimationFormInput = {
  form_id?: string;
  name: string;
  description?: string;
  status?: EstimationFormStatus;
  root: EstimationFormGraph;
  validation?: EstimationValidationResult | null;
  bump_version?: boolean;
};

export async function fetchEstimationFormDefinitionsApi(
  project_idx: number,
  include_archived = false
): Promise<EstimationFormDefinitionRecord[]> {
  if (!project_idx) return [];
  const res = await makeRequest.post("/estimation-forms", {
    project_idx,
    include_archived,
  });
  return res.data.formDefinitions ?? [];
}

export async function fetchEstimationFormDefinitionApi(
  project_idx: number,
  form_id: string
): Promise<EstimationFormDefinitionRecord | null> {
  if (!project_idx || !form_id) return null;
  const res = await makeRequest.post("/estimation-forms/get", {
    project_idx,
    form_id,
  });
  return res.data.formDefinition ?? null;
}

export async function upsertEstimationFormDefinitionApi(
  project_idx: number,
  payload: UpsertEstimationFormInput
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/estimation-forms/upsert", {
    project_idx,
    ...payload,
  });
  return res.data as {
    success: boolean;
    form_id: string;
    version: number;
    created: boolean;
  };
}

export async function updateEstimationFormStatusApi(
  project_idx: number,
  form_id: string,
  status: EstimationFormStatus
) {
  if (!project_idx || !form_id) return null;
  const res = await makeRequest.post("/estimation-forms/status", {
    project_idx,
    form_id,
    status,
  });
  return res.data as {
    success: boolean;
    affected_rows: number;
  };
}

export async function deleteEstimationFormDefinitionApi(
  project_idx: number,
  form_id: string
) {
  if (!project_idx || !form_id) return null;
  const res = await makeRequest.post("/estimation-forms/delete", {
    project_idx,
    form_id,
  });
  return res.data as {
    success: boolean;
    affected_rows: number;
  };
}
