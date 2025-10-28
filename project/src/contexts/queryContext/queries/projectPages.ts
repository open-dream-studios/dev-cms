// src/context/queryContext/queries/projectPages.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { ProjectPage } from "@/types/pages";

export function useProjectPages(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: projectPages = [],
    isLoading: isLoadingProjectPages,
    refetch: refetchProjectPages,
  } = useQuery<ProjectPage[]>({
    queryKey: ["projectPages", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/pages/get", {
        project_idx: currentProjectId,
      });
      return res.data.pages;
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertProjectPageMutation = useMutation({
    mutationFn: async (data: ProjectPage) => {
      const res = await makeRequest.post("/api/pages/upsert", {
        ...data,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectPages", currentProjectId],
      });
    },
  });

  const deleteProjectPageMutation = useMutation({
    mutationFn: async (page_id: string) => {
      await makeRequest.post("/api/pages/delete", {
        project_idx: currentProjectId,
        page_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectPages", currentProjectId],
      });
    },
  });

  const reorderProjectPagesMutation = useMutation({
    mutationFn: async (data: {
      parent_page_id: number | null;
      orderedIds: string[];
    }) => {
      await makeRequest.post("/api/pages/reorder", {
        project_idx: currentProjectId,
        ...data,
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: ["projectPages", currentProjectId],
      });
      const previousPages = queryClient.getQueryData<ProjectPage[]>([
        "projectPages",
        currentProjectId,
      ]);
      return { previousPages };
    },
    onError: (err, _, ctx) => {
      if (ctx?.previousPages) {
        queryClient.setQueryData(
          ["projectPages", currentProjectId],
          ctx.previousPages
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectPages", currentProjectId],
        refetchType: "inactive",
      });
    },
  });

  const upsertProjectPage = async (page: ProjectPage) => {
    const res = await upsertProjectPageMutation.mutateAsync(page);
    return res.page_id;
  };

  const deleteProjectPage = async (page_id: string) => {
    await deleteProjectPageMutation.mutateAsync(page_id);
  };

  const reorderProjectPages = async (
    parent_page_id: number | null,
    orderedIds: string[]
  ) => {
    await reorderProjectPagesMutation.mutateAsync({
      parent_page_id,
      orderedIds,
    });
  };

  return {
    projectPages,
    isLoadingProjectPages,
    refetchProjectPages,
    upsertProjectPage,
    deleteProjectPage,
    reorderProjectPages,
  };
}
