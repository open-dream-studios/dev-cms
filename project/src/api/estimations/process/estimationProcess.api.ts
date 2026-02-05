// project/src/api/estimations/process/estimationProcess.api.ts
import { makeRequest } from "@/util/axios";

export type EstimationProcess = {
  id: number;
  process_id: string;
  label: string | null;
  project_idx: number;
  created_at: string;
  updated_at: string;
};

export async function fetchEstimationProcessesApi(project_idx: number) {
  const res = await makeRequest.post("/estimations/process", {
    project_idx,
  });
  return res.data.processes as EstimationProcess[];
}

export async function upsertEstimationProcessApi(
  project_idx: number,
  payload: {
    process_id?: string | null;
    label?: string | null;
  }
) {
  const res = await makeRequest.post("/estimations/process/upsert", {
    project_idx,
    ...payload,
  });
  return { process_id: res.data.process_id as string };
}

export async function deleteEstimationProcessApi(
  project_idx: number,
  process_id: string
) {
  await makeRequest.post("/estimations/process/delete", {
    project_idx,
    process_id,
  });
  return { success: true };
}