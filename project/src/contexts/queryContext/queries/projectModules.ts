// src/context/queryContext/queries/projectModules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { ProjectModule } from "@/types/project";

export function useProjectModules(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: projectModules = [],
    isLoading: isLoadingProjectModules,
    refetch: refetchProjectModules,
  } = useQuery<ProjectModule[]>({
    queryKey: ["projectModules", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/modules", {
        project_idx: currentProjectId,
      });
      return res.data.modules;
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertProjectModuleMutation = useMutation({
    mutationFn: async (data: ProjectModule) => {
      await makeRequest.post("/api/modules/upsert", {
        ...data,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProjectId],
      });
    },
  });

  const deleteProjectModuleMutation = useMutation({
    mutationFn: async (module_id: string) => {
      await makeRequest.post("/api/modules/delete", {
        module_id,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProjectId],
      });
    },
  });

  const hasProjectModule = (identifier: string): boolean => {
    return projectModules?.some((pm) => pm.identifier === identifier);
  };

  const upsertProjectModule = async (projectModule: ProjectModule) => {
    await upsertProjectModuleMutation.mutateAsync(projectModule);
  };

  const deleteProjectModule = async (module_id: string) => {
    await deleteProjectModuleMutation.mutateAsync(module_id);
  };

  return {
    projectModules,
    isLoadingProjectModules,
    refetchProjectModules,
    upsertProjectModule,
    deleteProjectModule,
    hasProjectModule,
  };
}
