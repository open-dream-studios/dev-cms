// project/src/contexts/queryContext/queries/estimationForms/estimationForms.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  EstimationFormStatus,
  EstimationFormGraph,
  EstimationValidationResult,
} from "@open-dream/shared";
import {
  deleteEstimationFormDefinitionApi,
  fetchEstimationFormDefinitionApi,
  fetchEstimationFormDefinitionsApi,
  type EstimationFormDefinitionRecord,
  updateEstimationFormStatusApi,
  upsertEstimationFormDefinitionApi,
} from "@/api/estimationForms/estimationForms.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export type UpsertEstimationFormMutationInput = {
  form_id?: string;
  name: string;
  description?: string;
  status?: EstimationFormStatus;
  root: EstimationFormGraph;
  validation?: EstimationValidationResult | null;
  bump_version?: boolean;
};

export function useEstimationForms(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  options?: { includeArchived?: boolean }
) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";
  const includeArchived = Boolean(options?.includeArchived);

  const {
    data: estimationFormsData,
    isLoading: isLoadingEstimationForms,
    refetch: refetchEstimationForms,
  } = useQuery<EstimationFormDefinitionRecord[]>({
    queryKey: ["estimationForms", currentProjectId, includeArchived],
    queryFn: async () =>
      fetchEstimationFormDefinitionsApi(currentProjectId!, includeArchived),
    enabled: isLoggedIn && !!currentProjectId && !isPublic,
  });

  const fetchSingleForm = async (form_id: string) =>
    fetchEstimationFormDefinitionApi(currentProjectId!, form_id);

  const upsertEstimationFormMutation = useMutation({
    mutationFn: async (payload: UpsertEstimationFormMutationInput) =>
      upsertEstimationFormDefinitionApi(currentProjectId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["estimationForms", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Upsert estimation form failed:", error);
    },
  });

  const upsertEstimationForm = async (
    payload: UpsertEstimationFormMutationInput
  ) => {
    const res = await upsertEstimationFormMutation.mutateAsync(payload);
    return res;
  };

  const updateFormStatusMutation = useMutation({
    mutationFn: async (input: {
      form_id: string;
      status: EstimationFormStatus;
    }) => updateEstimationFormStatusApi(currentProjectId!, input.form_id, input.status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["estimationForms", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Update estimation form status failed:", error);
    },
  });

  const updateFormStatus = async (
    form_id: string,
    status: EstimationFormStatus
  ) => {
    await updateFormStatusMutation.mutateAsync({ form_id, status });
  };

  const deleteEstimationFormMutation = useMutation({
    mutationFn: async (form_id: string) =>
      deleteEstimationFormDefinitionApi(currentProjectId!, form_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["estimationForms", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Delete estimation form failed:", error);
    },
  });

  const deleteEstimationForm = async (form_id: string) => {
    await deleteEstimationFormMutation.mutateAsync(form_id);
  };

  return {
    estimationFormsData,
    isLoadingEstimationForms,
    refetchEstimationForms,
    fetchSingleForm,
    upsertEstimationForm,
    updateFormStatus,
    deleteEstimationForm,
  };
}
