// project/src/contexts/queryContext/queries/estimations/if_trees/estimationIfTrees.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIfTreesApi,
  upsertIfTreeApi,
  deleteIfTreeApi,
  upsertExpressionApi,
  deleteExpressionApi,
  upsertBranchApi,
  reorderBranchesApi,
  deleteBranchApi,
  fetchVariablesApi,
  upsertVariableApi,
  deleteVariableApi,
  upsertReturnNumberApi,
  upsertReturnAdjustmentApi,
  loadVariableIfTreeApi,
  loadConditionalIfTreeApi,
  loadAdjustmentIfTreeApi,
  upsertConditionalBindingApi,
  deleteConditionalBindingApi,
  upsertAdjustmentBindingApi,
  deleteAdjustmentBindingApi,
  upsertReturnBooleanApi,
} from "@/api/estimations/if_trees/estimationIfTrees.api";

export function useEstimationIfTrees(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const qc = useQueryClient();

  /* ========= IF TREES ========= */

  const { data: ifTrees = [] } = useQuery({
    queryKey: ["ifTrees", currentProjectId],
    queryFn: () => fetchIfTreesApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertIfTree = useMutation({
    mutationFn: (payload: any) => upsertIfTreeApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["ifTrees", currentProjectId] }),
  });

  const deleteIfTree = useMutation({
    mutationFn: (id: number) => deleteIfTreeApi(currentProjectId!, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["ifTrees", currentProjectId] }),
  });

  /* ========= EXPRESSIONS ========= */

  const upsertExpression = useMutation({
    mutationFn: (payload: any) =>
      upsertExpressionApi(currentProjectId!, payload),
  });

  const deleteExpression = useMutation({
    mutationFn: (id: number) => deleteExpressionApi(currentProjectId!, id),
  });

  /* ========= BRANCHES ========= */

  const upsertBranch = useMutation({
    mutationFn: (payload: any) => upsertBranchApi(currentProjectId!, payload),
  });

  const reorderBranches = useMutation({
    mutationFn: (orderedIds: number[]) =>
      reorderBranchesApi(currentProjectId!, orderedIds),
  });

  const deleteBranch = useMutation({
    mutationFn: (id: number) => deleteBranchApi(currentProjectId!, id),
  });

  const { data: variables = [] } = useQuery({
    queryKey: ["estimationVariables", currentProjectId],
    queryFn: () => fetchVariablesApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertVariable = useMutation({
    mutationFn: (payload: any) => upsertVariableApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationVariables", currentProjectId],
      }),
  });

  const deleteVariable = useMutation({
    mutationFn: (var_key: string) =>
      deleteVariableApi(currentProjectId!, var_key),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationVariables", currentProjectId],
      }),
  });

  // RETURN
  const upsertReturnNumber = useMutation({
    mutationFn: (p: any) => upsertReturnNumberApi(currentProjectId!, p),
  });

  const upsertReturnAdjustment = useMutation({
    mutationFn: (p: any) => upsertReturnAdjustmentApi(currentProjectId!, p),
  });

  /* ========= LOAD ========= */
  const loadConditionalIfTree = (nodeId: string) =>
    loadConditionalIfTreeApi(currentProjectId!, nodeId);

  const loadAdjustmentIfTree = (nodeId: number) =>
    loadAdjustmentIfTreeApi(currentProjectId!, nodeId);

  /* ========= BINDINGS ========= */
  const upsertConditionalBinding = useMutation({
    mutationFn: (p: any) => upsertConditionalBindingApi(currentProjectId!, p),
  });

  const deleteConditionalBinding = useMutation({
    mutationFn: (nodeId: number) =>
      deleteConditionalBindingApi(currentProjectId!, nodeId),
  });

  const upsertAdjustmentBinding = useMutation({
    mutationFn: (p: any) => upsertAdjustmentBindingApi(currentProjectId!, p),
  });

  const deleteAdjustmentBinding = useMutation({
    mutationFn: (nodeId: number) =>
      deleteAdjustmentBindingApi(currentProjectId!, nodeId),
  });

  const upsertReturnBoolean = useMutation({
    mutationFn: (p: any) => upsertReturnBooleanApi(currentProjectId!, p),
  });

  return {
    ifTrees,
    variables,

    upsertIfTree: (p: any) => upsertIfTree.mutateAsync(p),
    deleteIfTree: (id: number) => deleteIfTree.mutateAsync(id),

    upsertExpression: (p: any) => upsertExpression.mutateAsync(p),
    deleteExpression: (id: number) => deleteExpression.mutateAsync(id),

    upsertBranch: (p: any) => upsertBranch.mutateAsync(p),
    reorderBranches: (ids: number[]) => reorderBranches.mutateAsync(ids),
    deleteBranch: (id: number) => deleteBranch.mutateAsync(id),

    upsertVariable: (p: any) => upsertVariable.mutateAsync(p),
    deleteVariable: (k: string) => deleteVariable.mutateAsync(k),


    loadVariableIfTree: (treeId: number) =>
      loadVariableIfTreeApi(currentProjectId!, treeId),

    upsertReturnNumber: (p: any) => upsertReturnNumber.mutateAsync(p),
    upsertReturnAdjustment: (p: any) => upsertReturnAdjustment.mutateAsync(p),
    upsertReturnBoolean: (p: any) => upsertReturnBoolean.mutateAsync(p),

    loadConditionalIfTree,
    loadAdjustmentIfTree,

    upsertConditionalBinding: (p: any) =>
      upsertConditionalBinding.mutateAsync(p),
    deleteConditionalBinding: (nodeId: number) =>
      deleteConditionalBinding.mutateAsync(nodeId),

    upsertAdjustmentBinding: (p: any) => upsertAdjustmentBinding.mutateAsync(p),
    deleteAdjustmentBinding: (nodeId: number) =>
      deleteAdjustmentBinding.mutateAsync(nodeId),
  };
}
