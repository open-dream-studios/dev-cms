// project/src/contexts/queryContext/queries/estimations/runnableGraphs.ts
import { useQuery } from "@tanstack/react-query";
import { fetchRunnableDecisionGraphsApi } from "@/api/estimations/runtimeGraphs.api";

export function useRunnableDecisionGraphs(
  enabled: boolean,
  project_idx?: number | null
) {
  return useQuery({
    queryKey: ["runnable-decision-graphs", project_idx],
    enabled: enabled && !!project_idx,
    queryFn: () => fetchRunnableDecisionGraphsApi(project_idx!),
  });
}