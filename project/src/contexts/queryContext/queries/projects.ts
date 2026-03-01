// project/src/context/queryContext/queries/projects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@open-dream/shared";
import {
  deleteProjectApi,
  fetchProjectsApi,
  upsertProjectApi,
} from "@/api/projects.api";
import { useRouteScope } from "@/contexts/routeScopeContext";
import { useEffect } from "react";
import {
  setCurrentProjectData,
  useCurrentDataStore,
} from "@/store/currentDataStore";

export function useProjects(isLoggedIn: boolean) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => fetchProjectsApi(),
    enabled: isLoggedIn && !isPublic,
  });

  const upsertProjectMutation = useMutation({
    mutationFn: async (project: Project) => upsertProjectApi(project),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });

  const upsertProject = async (project: Project) => {
    return await upsertProjectMutation.mutateAsync(project);
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async (project_id: string) => deleteProjectApi(project_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });

  const deleteProject = async (project_id: string) => {
    await deleteProjectMutation.mutateAsync(project_id);
  };

  useEffect(() => {
    if (!projectsData?.length) return;
    const { currentProjectId } = useCurrentDataStore.getState();
    if (!currentProjectId) return;
    const updated = projectsData.find((p) => p.id === currentProjectId);
    if (!updated) return;
    setCurrentProjectData(updated);
  }, [projectsData]);

  return {
    projectsData,
    isLoadingProjects,
    refetchProjects,
    upsertProject,
    deleteProject,
  };
}
