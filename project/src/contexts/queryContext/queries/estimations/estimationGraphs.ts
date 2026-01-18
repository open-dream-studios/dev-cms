// project/src/context/queryContext/queries/estimations/estimationGraphs.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEstimationGraphApi,
  fetchEstimationGraphsApi,
  publishEstimationGraphApi,
  updateEstimationGraphApi,
} from "@/api/estimations/estimationGraphs.api";

export function useEstimationGraphs(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const qc = useQueryClient();

  const { data: graphs = [], isLoading } = useQuery({
    queryKey: ["estimationGraphs", currentProjectId],
    queryFn: () => fetchEstimationGraphsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const createGraphMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      graph_type: "decision" | "pricing";
    }) => createEstimationGraphApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["estimationGraphs", currentProjectId] }),
  });

  const updateGraphMutation = useMutation({
    mutationFn: (payload: { graph_id: string; name: string }) =>
      updateEstimationGraphApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["estimationGraphs", currentProjectId] }),
  });

  const publishGraphMutation = useMutation({
    mutationFn: (payload: { graph_id: string }) =>
      publishEstimationGraphApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["estimationGraphs", currentProjectId] }),
  });

  return {
    graphs,
    isLoadingEstimationGraphs: isLoading,
    createGraph: (p: { name: string; graph_type: "decision" | "pricing" }) =>
      createGraphMutation.mutateAsync(p),
    updateGraph: (p: { graph_id: string; name: string }) =>
      updateGraphMutation.mutateAsync(p),
    publishGraph: (p: { graph_id: string }) =>
      publishGraphMutation.mutateAsync(p),
  };
}
