// project/src/api/estimations/runtime.api.ts
import { makeRequest } from "@/util/axios";
import type { EstimationGraphNode } from "@open-dream/shared";

export type RuntimeState = {
  estimate_run_id: string;
  nodes: EstimationGraphNode[];
  facts: Record<string, any>;
  completed?: boolean;
};

export async function startRuntimeApi(payload: {
  project_idx: number;
  decision_graph_idx: number;
  pricing_graph_idx: number;
}) {
  const res = await makeRequest.post("/estimations/runtime/start", payload);
  return res.data as RuntimeState;
}

export async function fetchRuntimeStateApi(payload: {
  estimate_run_id: string;
  project_idx: number;
}) {
  const res = await makeRequest.post("/estimations/runtime/state", payload);
  return res.data as RuntimeState;
}

export async function answerNodeApi(payload: {
  estimate_run_id: string;
  node_id: string;
  answer: any;
  project_idx: number;
  batch_id: string;
}) {
  const res = await makeRequest.post("/estimations/runtime/answer", payload);
  return res.data as RuntimeState;
}

export async function goBackApi(payload: {
  estimate_run_id: string;
  project_idx: number;
}) {
  const res = await makeRequest.post("/estimations/runtime/back", payload);
  return res.data;
}
