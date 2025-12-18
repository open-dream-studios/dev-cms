// src/context/queryContext/queries/projects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@open-dream/shared";
import {
  deleteProjectApi,
  fetchProjectsApi,
  upsertProjectApi,
} from "@/api/projects.api";

export function useProjects(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => fetchProjectsApi(),
    enabled: isLoggedIn,
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

  return {
    projectsData,
    isLoadingProjects,
    refetchProjects,
    upsertProject,
    deleteProject,
  };
}
