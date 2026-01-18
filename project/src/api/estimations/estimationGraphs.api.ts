// project/src/api/estimations/estimationGraphs.api.ts
import { makeRequest } from "@/util/axios";
import { EstimationGraph, EstimationGraphType } from "@open-dream/shared";

export async function fetchEstimationGraphsApi(project_idx: number) {
  const res = await makeRequest.post("/estimations/graphs", { project_idx });
  return res.data.graphs as EstimationGraph[];
}

export async function createEstimationGraphApi(
  project_idx: number,
  payload: { name: string; graph_type: EstimationGraphType }
) {
  const res = await makeRequest.post("/estimations/graphs/create", {
    project_idx,
    ...payload,
  });
  return { graph_id: res.data.graph_id as string };
}

export async function updateEstimationGraphApi(
  project_idx: number,
  payload: { graph_id: string; name: string }
) {
  await makeRequest.post("/estimations/graphs/update", {
    project_idx,
    ...payload,
  });
  return { success: true };
}

export async function publishEstimationGraphApi(
  project_idx: number,
  payload: { graph_id: string }
) {
  await makeRequest.post("/estimations/graphs/publish", {
    project_idx,
    ...payload,
  });
  return { success: true };
}
