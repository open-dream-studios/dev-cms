// src/context/queryContext/queries/modules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { ModuleDefinition } from "@shared/types/models/project";

export function useModuleDefinitions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: moduleDefinitions = [],
    isLoading: isLoadingModuleDefinitions,
    refetch: refetchModuleDefinitions,
  } = useQuery<ModuleDefinition[]>({
    queryKey: ["moduleDefinitions"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/modules/definitions");
      return res.data.moduleDefinitions;
    },
    enabled: isLoggedIn,
  });

  const upsertModuleMutation = useMutation({
    mutationFn: async (data: ModuleDefinition) => {
      await makeRequest.post("/api/modules/definitions/upsert", {
        ...data,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moduleDefinitions"] });
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProjectId],
      });
    },
  });

  const upsertModuleDefinition = async (data: ModuleDefinition) => {
    await upsertModuleMutation.mutateAsync(data);
  };

  const deleteModuleDefinitionMutation = useMutation({
    mutationFn: async (module_definition_id: string) => {
      await makeRequest.post("/api/modules/definitions/delete", {
        project_idx: currentProjectId,
        module_definition_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moduleDefinitions"] });
    },
  });

  const deleteModuleDefinition = async (module_definition_id: string) => {
    await deleteModuleDefinitionMutation.mutateAsync(module_definition_id);
  };

  return {
    moduleDefinitions,
    isLoadingModuleDefinitions,
    refetchModuleDefinitions,
    upsertModuleDefinition,
    deleteModuleDefinition,
  };
}
