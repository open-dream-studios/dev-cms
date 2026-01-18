// project/src/api/estimations/runtimeGraphs.api.ts
import { makeRequest } from "@/util/axios";
import type { EstimationGraph } from "@open-dream/shared";

export async function fetchRunnableDecisionGraphsApi(project_idx: number) {
  const res = await makeRequest.post("/estimations/graphs", { project_idx });
  return (res.data.graphs as EstimationGraph[]).filter(
    (g) => g.graph_type === "decision" && g.status === "published"
  );
}