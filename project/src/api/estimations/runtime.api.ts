import { makeRequest } from "@/util/axios";
import { utcToLocal } from "@/util/functions/Time";
import type { EstimationGraphNode, EstimationRun } from "@open-dream/shared";

export type RuntimeState = {
  success: boolean;
  estimate_run_id: string;
  facts: Record<string, any>;
  page_nodes: EstimationGraphNode[];
  page_answers: Record<string, any>;
  completed?: boolean;
  is_first_page: boolean;
  can_go_back: boolean;
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
  return res.data as RuntimeState;
}

export const resumeRuntimeApi = async (data: {
  estimate_run_id: string;
  project_idx: number;
}) => {
  const res = await makeRequest.post("/estimations/runtime/resume", data);
  return res.data as RuntimeState;
};

export async function fetchRunsApi(payload: {
  project_idx: number;
  decision_graph_idx: number;
}) {
  const { project_idx, decision_graph_idx } = payload;
  if (!project_idx) return [];
  const res = await makeRequest.post("/estimations/runtime/runs", {
    project_idx,
    decision_graph_idx,
  });

  const runs: EstimationRun[] = (res.data.runs || []).map(
    (run: EstimationRun) => ({
      ...run,
      created_at: run.created_at
        ? new Date(utcToLocal(run.created_at as string)!)
        : null,
      updated_at: run.updated_at
        ? new Date(utcToLocal(run.updated_at as string)!)
        : null,
    })
  );

  return runs as EstimationRun[];
}
