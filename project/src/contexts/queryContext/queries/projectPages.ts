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
      await makeRequest.post("/api/pages/upsert", {
        project_idx: currentProjectId,
        ...data,
      });
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
      project_idx: number;
      parent_page_id: number | null;
      orderedIds: string[];
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

      // if (previousPages) {
      //   const reordered = previousPages
      //     .filter((p) => p.parent_page_id === data.parent_page_id)
      //     .map((p) => p.id);

      //   // overwrite locally
      //   queryClient.setQueryData<ProjectPage[]>(
      //     ["projectPages", currentProjectId],
      //     (old) => {
      //       if (!old) return old;
      //       const map = new Map(old.map((p) => [p.id, p]));
      //       return data.orderedIds
      //         .map((id) => map.get(id)!)
      //         .concat(old.filter((p) => !data.orderedIds.includes(p.id)));
      //     }
      //   );
      // }

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
    upsertProjectPageMutation,
    deleteProjectPageMutation,
    reorderProjectPagesMutation,
  };
}
