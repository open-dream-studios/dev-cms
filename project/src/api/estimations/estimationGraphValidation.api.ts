// project/src/api/estimations/estimationGraphValidation.api.tsimport { makeRequest } from "@/util/axios";
import { makeRequest } from "@/util/axios";

export type EstimationGraphValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export async function validateEstimationGraphApi(
  graph_idx: number,
  currentProjectId: number
): Promise<EstimationGraphValidationResult> {
  const res = await makeRequest.post("/estimations/graphs/validate", {
    graph_idx,
    project_idx: currentProjectId,
  });

  return res.data as EstimationGraphValidationResult;
}
