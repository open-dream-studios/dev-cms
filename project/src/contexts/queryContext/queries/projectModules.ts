// project/src/context/queryContext/queries/projectModules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectModule } from "@open-dream/shared";
import {
  deleteProjectModuleApi,
  fetchProjectModulesApi,
  upsertProjectModuleApi,
} from "@/api/projectModules.api";
import { useRouteScope } from "@/contexts/routeScopeContext";
import { useCallback } from "react";

export function useProjectModules(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: projectModules = [],
    isLoading: isLoadingProjectModules,
    refetch: refetchProjectModules,
  } = useQuery<ProjectModule[]>({
    queryKey: ["projectModules", currentProjectId],
    queryFn: async () => fetchProjectModulesApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !isPublic,
  });

  const upsertProjectModuleMutation = useMutation({
    mutationFn: async (data: ProjectModule) =>
      upsertProjectModuleApi(currentProjectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProjectId],
      });
    },
  });

  const deleteProjectModuleMutation = useMutation({
    mutationFn: async (module_id: string) =>
      deleteProjectModuleApi(currentProjectId!, module_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProjectId],
      });
    },
  });

  const hasProjectModule = useCallback(
    (identifier: string) =>
      projectModules.some((pm) => pm.module_identifier === identifier),
    [projectModules]
  );

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
