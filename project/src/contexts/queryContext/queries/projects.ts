// src/context/queryContext/queries/projects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Project } from "@/types/project";

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
    queryFn: async () => {
      const res = await makeRequest.get("/api/projects");
      return res.data.projects;
    },
    enabled: isLoggedIn,
  });

  const upsertProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      const res = await makeRequest.post("/api/projects/upsert", project);
      return res.data.project
    },
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
    mutationFn: async (project_id: string) => {
      await makeRequest.post("/api/projects/delete", {
        project_id,
      });
    },
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
