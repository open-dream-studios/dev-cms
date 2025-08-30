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
      const res = await makeRequest.post("/api/modules/get", {
        project_idx: currentProjectId,
      });
      return res.data.projectModules;
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const addProjectModuleMutation = useMutation({
    mutationFn: async (data: {
      project_idx: number;
      module_id: number;
      settings?: any;
    }) => {
      await makeRequest.post("/api/modules/add", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProjectId],
      });
    },
  });

  const deleteProjectModuleMutation = useMutation({
    mutationFn: async (data: { project_idx: number; module_id: number }) => {
      await makeRequest.post("/api/modules/delete", data);
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

  return {
    projectModules,
    isLoadingProjectModules,
    refetchProjectModules,
    addProjectModuleMutation,
    deleteProjectModuleMutation,
    hasProjectModule,
  };
}
