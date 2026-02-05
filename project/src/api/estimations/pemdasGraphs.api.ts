// project/src/api/estimations/pemdasGraphs.api.ts
import { makeRequest } from "@/util/axios";
import type { PemdasSerialized } from
  "@/modules/EstimationModule/EstimationPEMDAS/_helpers/pemdas.serialize";

export type PemdasGraphType = "estimation" | "variable";

export async function upsertPemdasGraphApi(
  project_idx: number,
  payload: {
    process_id: number;
    pemdas_type: PemdasGraphType;
    conditional_id?: string;
    config: PemdasSerialized;
  }
) {
  const res = await makeRequest.post("/estimations/pemdas/upsert", {
    project_idx,
    ...payload,
  });
  return res.data;
}

export async function getPemdasGraphApi(
  project_idx: number,
  payload: {
    process_id: number;
    pemdas_type: PemdasGraphType;
    conditional_id?: string;
  }
) {
  const res = await makeRequest.post("/estimations/pemdas/get", {
    project_idx,
    ...payload,
  });
  return res.data.config as PemdasSerialized | null;
}

export async function deletePemdasGraphApi(
  project_idx: number,
  payload: {
    process_id: number;
    pemdas_type: PemdasGraphType;
    conditional_id?: string;
  }
) {
  const res = await makeRequest.post("/estimations/pemdas/delete", {
    project_idx,
    ...payload,
  });
  return res.data;
}

export async function calculatePemdasGraphApi(
  project_idx: number,
  payload: {
    process_id: number;
    process_run_id: number;
    fact_inputs: Record<string, string>;
  }
) {
  const res = await makeRequest.post("/estimations/pemdas/calculate", {
    project_idx,
    ...payload,
  });
  return res.data;
}