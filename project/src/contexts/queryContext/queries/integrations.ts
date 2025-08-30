// src/context/queryContext/queries/integrations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Integration, ProjectUser } from "@/types/project";
import { User } from "@/contexts/authContext";
import { getUserAccess } from "@/util/functions/Users";

export function useIntegrations(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  currentUser: User | null,
  projectUsers: ProjectUser[]
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
    enabled:
      isLoggedIn &&
      !!currentProjectId &&
      getUserAccess(currentProjectId, projectUsers, currentUser?.email) >= 3,
  });

  const upsertIntegrationMutation = useMutation({
    mutationFn: async (data: {
      project_idx: number;
      module_id: number;
      config: Record<string, string>;
    }) => {
      await makeRequest.post("/api/integrations/update", data);
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

  const upsertIntegration = async (data: {
    project_idx: number;
    module_id: number;
    config: Record<string, string>;
  }) => {
    await upsertIntegrationMutation.mutateAsync(data);
  };

  const deleteIntegrationKeyMutation = useMutation({
    mutationFn: async (integration: {
      project_idx: number;
      module_id: number;
      key: string;
    }) => {
      await makeRequest.post("/api/integrations/delete", {
        project_idx: integration.project_idx,
        module_id: integration.module_id,
        key: integration.key,
      });
      return integration;
    },
    onMutate: async (deletedIntegration) => {
      const queryKey = ["integrations", currentProjectId];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<any[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = previousData.map((integration) => {
        if (integration.module_id !== deletedIntegration.module_id)
          return integration;

        const newConfig = { ...integration.config };
        delete newConfig[deletedIntegration.key];

        return { ...integration, config: newConfig };
      });

      queryClient.setQueryData(queryKey, newData);
      return { previousData, queryKey };
    },
    onError: (_err, _deletedIntegration, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _err, _deletedIntegration, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const deleteIntegrationKey = async (data: {
    project_idx: number;
    module_id: number;
    key: string;
  }) => {
    await deleteIntegrationKeyMutation.mutateAsync(data);
  };

  return {
    integrations,
    isLoadingIntegrations,
    refetchIntegrations,
    upsertIntegration,
    deleteIntegrationKey,
  };
}
