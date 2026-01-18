// project/src/api/estimation/estimationGraphEdges.api.ts
import { makeRequest } from "@/util/axios";
import { EstimationGraphEdge } from "@open-dream/shared";

export async function fetchEstimationGraphEdgesApi(
  graph_idx: number,
  currentProjectId: number
) {
  const res = await makeRequest.post("/estimations/graph-edges", {
    graph_idx,
    project_idx: currentProjectId,
  });
  return res.data.edges as EstimationGraphEdge[];
}

export async function upsertEstimationGraphEdgeApi(
  graph_idx: number,
  edge: Partial<EstimationGraphEdge>,
  currentProjectId: number
) {
  const res = await makeRequest.post("/estimations/graph-edges/upsert", {
    graph_idx,
    edge,
    project_idx: currentProjectId,
  });
  return { edge_id: res.data.edge_id as string };
}

export async function deleteEstimationGraphEdgeApi(
  edge_id: string,
  currentProjectId: number
) {
  await makeRequest.post("/estimations/graph-edges/delete", {
    edge_id,
    project_idx: currentProjectId,
  });
  return { success: true };
}
