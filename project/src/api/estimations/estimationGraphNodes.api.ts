// project/src/api/estimations/estimationGraphNodes.api.ts
import { makeRequest } from "@/util/axios";
import { EstimationGraphNode } from "@open-dream/shared";

export async function fetchEstimationGraphNodesApi(
  graph_idx: number,
  currentProjectId: number
) {
  const res = await makeRequest.post("/estimations/graph-nodes", {
    graph_idx,
    project_idx: currentProjectId,
  });
  return res.data.nodes as EstimationGraphNode[];
}

export async function upsertEstimationGraphNodeApi(
  graph_idx: number,
  node: Partial<EstimationGraphNode>,
  currentProjectId: number
) {
  const res = await makeRequest.post("/estimations/graph-nodes/upsert", {
    graph_idx,
    node,
    project_idx: currentProjectId,
  });
  return { node_id: res.data.node_id as string };
}

export async function deleteEstimationGraphNodeApi(
  node_id: string,
  currentProjectId: number
) {
  await makeRequest.post("/estimations/graph-nodes/delete", {
    node_id,
    project_idx: currentProjectId,
  });
  return { success: true };
}
