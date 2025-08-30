// src/context/queryContext/queries/projects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Project, AddProjectInput } from "@/types/project";
import { useMemo } from "react";

export function useProjects(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: projectsData = [],
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

  const addProjectMutation = useMutation({
    mutationFn: async (projectData: AddProjectInput) => {
      await makeRequest.post("/api/projects/add", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const addProject = async (projectData: AddProjectInput) => {
    await addProjectMutation.mutateAsync(projectData);
  };

  const updateProjectMutation = useMutation({
    mutationFn: async (data: {
      project_idx: number;
      name: string;
      short_name?: string;
      domain?: string;
      backend_domain?: string;
      brand?: string;
      logo?: string | null;
    }) => {
      const res = await makeRequest.post("/api/projects/update", data);
      return res.data.project;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project[]>(["projects"], (old) => {
        if (!old) return [];
        return old.map((p) =>
          p.id === updatedProject.id ? updatedProject : p
        );
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateProject = async (data: {
    project_idx: number;
    name: string;
    short_name?: string;
    domain?: string;
    backend_domain?: string;
    brand?: string;
    logo?: string | null;
  }) => {
    await updateProjectMutation.mutateAsync(data);
  };

  const deleteProjectMutation = useMutation<
    void,
    Error,
    string[],
    { previousData: Project[] | undefined; queryKey: string[] }
  >({
    mutationFn: async (ids: string[]) => {
      await makeRequest.post("/api/projects/delete", {
        ids,
      });
    },
    onMutate: async (ids: string[]) => {
      const queryKey = ["projects"];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<Project[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = previousData.filter(
        (project) => !ids.includes(project.project_id)
      );
      queryClient.setQueryData(queryKey, newData);
      return { previousData, queryKey };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const deleteProject = async (project: Project) => {
    await deleteProjectMutation.mutateAsync([project.project_id]);
  };

  const currentProject = useMemo(() => {
    return projectsData.find((p) => p.id === currentProjectId) ?? null;
  }, [projectsData, currentProjectId]);

  return {
    projectsData,
    isLoadingProjects,
    refetchProjects,
    addProject,
    deleteProject,
    currentProject,
    updateProject
  };
}
