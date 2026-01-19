// project/src/contexts/queryContext/queries/estimations/estimationGraphValidation.ts
import { useQuery } from "@tanstack/react-query";
import {
  validateEstimationGraphApi,
  EstimationGraphValidationResult,
} from "@/api/estimations/estimationGraphValidation.api";

export function useEstimationGraphValidation(
  graph_idx: number | null,
  currentProjectId: number | null
) {
  return useQuery<EstimationGraphValidationResult>({
    queryKey: ["estimationGraphValidation", graph_idx],
    enabled: graph_idx !== null && graph_idx !== undefined,
    queryFn: () => validateEstimationGraphApi(graph_idx!, currentProjectId!),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
