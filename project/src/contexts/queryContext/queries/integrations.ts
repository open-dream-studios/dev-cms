// src/context/queryContext/queries/integrations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Integration } from "@open-dream/shared";

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
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.get("/api/integrations", {
        params: { project_idx: currentProjectId },
      });
      return res.data.integrations || [];
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertIntegrationMutation = useMutation({
    mutationFn: async (data: Integration) => {
      await makeRequest.post("/api/integrations/upsert", {
        ...data,
        project_idx: currentProjectId,
      });
    },
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
    await upsertIntegrationMutation.mutateAsync(data);
  };

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integration_id: string) => {
      await makeRequest.post("/api/integrations/delete", {
        integration_id,
        project_idx: currentProjectId,
      });
    },
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
