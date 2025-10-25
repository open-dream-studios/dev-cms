// project/src/context/queryContext/queries/mediaLinks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { MediaLink } from "@/types/media";

export function useMediaLinks(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: mediaLinks = [],
    isLoading: isLoadingMediaLinks,
    refetch: refetchMediaLinks,
  } = useQuery<MediaLink[]>({
    queryKey: ["mediaLinks", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.get("/api/media/media-links", {
        params: { project_idx: currentProjectId },
      });
      return res.data.mediaLinks || [];
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertMediaLinksMutation = useMutation({
    mutationFn: async (items: MediaLink[]) => {
      await makeRequest.post("/api/media/media-links/update", {
        project_idx: currentProjectId,
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaLinks", currentProjectId],
      });
    },
  });

  const upsertMediaLinks = async (items: MediaLink[]) => {
    await upsertMediaLinksMutation.mutateAsync(items);
  };

  // ✅ Bulk delete
  const deleteMediaLinksMutation = useMutation({
    mutationFn: async (mediaLinks: MediaLink[]) => {
      await makeRequest.post("/api/media/media-links/delete", {
        mediaLinks,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaLinks", currentProjectId],
      });
    },
  });

  const deleteMediaLinks = async (mediaLinks: MediaLink[]) => {
    await deleteMediaLinksMutation.mutateAsync(mediaLinks);
  };

  // ✅ Reorder
  const reorderMediaLinksMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await makeRequest.post("/api/media/media-links/reorder", {
        project_idx: currentProjectId,
        orderedIds,
      });
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({
        queryKey: ["mediaLinks", currentProjectId],
      });

      const prevData =
        queryClient.getQueryData<MediaLink[]>([
          "mediaLinks",
          currentProjectId,
        ]) || [];
      const reordered = prevData.map((m) => {
        if (!m.id) return m;
        const idx = orderedIds.indexOf(m.id);
        return idx === -1 || m.ordinal === idx ? m : { ...m, ordinal: idx };
      });

      queryClient.setQueryData(["mediaLinks", currentProjectId], reordered);
      return { prevData };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevData) {
        queryClient.setQueryData(
          ["mediaLinks", currentProjectId],
          ctx.prevData
        );
      }
    },
  });

  const reorderMediaLinks = async (orderedIds: number[]) => {
    await reorderMediaLinksMutation.mutateAsync(orderedIds);
  };

  return {
    mediaLinks,
    isLoadingMediaLinks,
    refetchMediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
    reorderMediaLinks,
  };
}
