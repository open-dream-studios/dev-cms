// project/src/context/queryContext/queries/pages.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectPage } from "@open-dream/shared";
import {
  fetchProjectPagesApi,
  upsertProjectPageApi,
  deleteProjectPageApi,
  reorderProjectPagesApi,
} from "@/api/pages.api";

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
    queryFn: () => fetchProjectPagesApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertProjectPageMutation = useMutation({
    mutationFn: (page: ProjectPage) =>
      upsertProjectPageApi(currentProjectId!, page),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectPages", currentProjectId],
      });
    },
  });

  const deleteProjectPageMutation = useMutation({
    mutationFn: (pageId: string) =>
      deleteProjectPageApi(currentProjectId!, pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectPages", currentProjectId],
      });
    },
  });

  const reorderProjectPagesMutation = useMutation({
    mutationFn: (data: {
      parent_page_id: number | null;
      orderedIds: string[];
    }) => reorderProjectPagesApi(currentProjectId!, data),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["projectPages", currentProjectId],
      });

      const previousPages = queryClient.getQueryData<ProjectPage[]>([
        "projectPages",
        currentProjectId,
      ]);

      return { previousPages };
    },
    onError: (_, __, ctx) => {
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

  const reorderProjectPages = async (
    parent_page_id: number | null,
    orderedIds: string[]
  ) => {
    return reorderProjectPagesMutation.mutateAsync({
      parent_page_id,
      orderedIds,
    });
  };

  return {
    projectPages,
    isLoadingProjectPages,
    refetchProjectPages,
    upsertProjectPage: upsertProjectPageMutation.mutateAsync,
    deleteProjectPage: deleteProjectPageMutation.mutateAsync,
    reorderProjectPages
  };
}
