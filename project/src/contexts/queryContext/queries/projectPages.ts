// src/context/queryContext/queries/projectPages.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";

export function useProjectPages(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: projectPages = [],
    isLoading: isLoadingProjectPages,
    refetch: refetchProjectPages,
  } = useQuery({
    queryKey: ["projectPages", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/pages/get", {
        project_idx: currentProjectId,
      });
      return res.data.projectPages;
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const addProjectPageMutation = useMutation({
    mutationFn: async (data: any) => {
      await makeRequest.post("/api/pages/add", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectPages", currentProjectId],
      });
    },
  });

  const deleteProjectPageMutation = useMutation({
    mutationFn: async (data: { project_idx: number; slug: string }) => {
      await makeRequest.post("/api/pages/delete", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectPages", currentProjectId],
      });
    },
  });

  return {
    projectPages,
    isLoadingProjectPages,
    refetchProjectPages,
    addProjectPageMutation,
    deleteProjectPageMutation,
  };
}