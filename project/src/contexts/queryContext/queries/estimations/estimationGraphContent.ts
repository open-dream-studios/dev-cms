// project/src/context/queryContext/queries/estimations/estimationGraphContent.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteEstimationGraphNodeApi,
  fetchEstimationGraphNodesApi,
  upsertEstimationGraphNodeApi,
} from "@/api/estimations/estimationGraphNodes.api";
import {
  deleteEstimationGraphEdgeApi,
  fetchEstimationGraphEdgesApi,
  upsertEstimationGraphEdgeApi,
} from "@/api/estimations/estimationGraphEdges.api";
import type {
  EstimationGraphNode,
  EstimationGraphEdge,
} from "@open-dream/shared";

export function useEstimationGraphContent(
  isLoggedIn: boolean,
  graph_idx: number | null,
  currentProjectId: number | null
) {
  const qc = useQueryClient();

  const { data: nodes = [], isLoading: isLoadingNodes } = useQuery({
    queryKey: ["estimationGraphNodes", graph_idx],
    queryFn: () => fetchEstimationGraphNodesApi(graph_idx!, currentProjectId!),
    enabled: isLoggedIn && !!graph_idx,
  });

  const { data: edges = [], isLoading: isLoadingEdges } = useQuery({
    queryKey: ["estimationGraphEdges", graph_idx],
    queryFn: () => fetchEstimationGraphEdgesApi(graph_idx!, currentProjectId!),
    enabled: isLoggedIn && !!graph_idx,
  });

  const upsertNodeMutation = useMutation({
    mutationFn: (node: Partial<EstimationGraphNode>) =>
      upsertEstimationGraphNodeApi(graph_idx!, node, currentProjectId!),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["estimationGraphNodes", graph_idx] }),
  });

  const deleteNodeMutation = useMutation({
    mutationFn: (node_id: string) =>
      deleteEstimationGraphNodeApi(node_id, currentProjectId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimationGraphNodes", graph_idx] });
      qc.invalidateQueries({ queryKey: ["estimationGraphEdges", graph_idx] });
    },
  });
  
  const upsertEdgeMutation = useMutation({
    mutationFn: (edge: Partial<EstimationGraphEdge>) =>
      upsertEstimationGraphEdgeApi(graph_idx!, edge, currentProjectId!),
    onSuccess: (res) => {
      if (!res.success) return;
      qc.invalidateQueries({ queryKey: ["estimationGraphEdges", graph_idx] });
    },
  });

  const deleteEdgeMutation = useMutation({
    mutationFn: (edge_id: string) =>
      deleteEstimationGraphEdgeApi(edge_id, currentProjectId!),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["estimationGraphEdges", graph_idx] }),
  });

  return {
    nodes,
    edges,
    isLoadingNodes,
    isLoadingEdges,
    upsertNode: (n: Partial<EstimationGraphNode>) =>
      upsertNodeMutation.mutateAsync(n),
    deleteNode: (node_id: string) => deleteNodeMutation.mutateAsync(node_id),
    upsertEdge: (e: Partial<EstimationGraphEdge>) =>
      upsertEdgeMutation.mutateAsync(e),
    deleteEdge: (edge_id: string) => deleteEdgeMutation.mutateAsync(edge_id),
  };
}
