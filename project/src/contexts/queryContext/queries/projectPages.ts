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
    mutationFn: async (data: { project_idx: number; id: number }) => {
      await makeRequest.post("/api/pages/delete", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectPages", currentProjectId],
      });
    },
  });

  const reorderProjectPagesMutation = useMutation({
    mutationFn: async (data: {
      project_idx: number;
      parent_page_id: number | null;
      orderedIds: number[];
    }) => {
      await makeRequest.post("/api/pages/reorder", data);
    },
    onMutate: async (data) => {
      // optimistic update
      await queryClient.cancelQueries({
        queryKey: ["projectPages", currentProjectId],
      });

      const previousPages = queryClient.getQueryData<ProjectPage[]>([
        "projectPages",
        currentProjectId,
      ]);

      if (previousPages) {
        const reordered = previousPages
          .filter((p) => p.parent_page_id === data.parent_page_id)
          .map((p) => p.id);

        // overwrite locally
        queryClient.setQueryData<ProjectPage[]>(
          ["projectPages", currentProjectId],
          (old) => {
            if (!old) return old;
            const map = new Map(old.map((p) => [p.id, p]));
            return data.orderedIds
              .map((id) => map.get(id)!)
              .concat(old.filter((p) => !data.orderedIds.includes(p.id)));
          }
        );
      }

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
      });
    },
  });

  return {
    projectPages,
    isLoadingProjectPages,
    refetchProjectPages,
    addProjectPageMutation,
    deleteProjectPageMutation,
    reorderProjectPagesMutation,
  };
}
