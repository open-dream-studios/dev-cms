// src/context/queryContext/queries/integrations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Integration } from "@open-dream/shared";
import {
  deleteProjectIntegrationApi,
  fetchProjectIntegrationsApi,
  upsertProjectIntegrationApi,
} from "@/api/integrations.api";

export function useIntegrations(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();
  const {
    data: integrations = [],
    isLoading: isLoadingIntegrations,
    refetch: refetchIntegrations,
  } = useQuery<Integration[]>({
    queryKey: ["integrations", currentProjectId],
    queryFn: async () => fetchProjectIntegrationsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertIntegrationMutation = useMutation({
    mutationFn: async (integration: Integration) =>
      upsertProjectIntegrationApi(currentProjectId!, integration),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["integrations", currentProjectId],
      });
    },
    onError: (error: any) => {
      if (error.response?.status === 402) {
        alert(
          "Key is not designated to this module. Please check the allowed keys and try again."
        );
      }
    },
  });

  const upsertIntegration = async (data: Integration) => {
    return await upsertIntegrationMutation.mutateAsync(data);
  };

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integration_id: string) =>
      deleteProjectIntegrationApi(currentProjectId!, integration_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const deleteIntegration = async (integration_id: string) => {
    await deleteIntegrationMutation.mutateAsync(integration_id);
  };

  return {
    integrations,
    isLoadingIntegrations,
    refetchIntegrations,
    upsertIntegration,
    deleteIntegration,
  };
}
