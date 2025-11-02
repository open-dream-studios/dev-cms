// project/src/context/queryContext/queries/mediaLinks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { MediaLink } from "@shared/types/models/media";

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

  return {
    mediaLinks,
    isLoadingMediaLinks,
    refetchMediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
  };
}
