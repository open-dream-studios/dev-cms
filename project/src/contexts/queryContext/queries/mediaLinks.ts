// project/src/context/queryContext/queries/mediaLinks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MediaLink } from "@open-dream/shared";
import {
  deleteMediaLinksApi,
  fetchMediaLinksApi,
  upsertMediaLinksApi,
} from "@/api/mediaLinks.api";

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
    queryFn: async () => fetchMediaLinksApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertMediaLinksMutation = useMutation({
    mutationFn: async (items: MediaLink[]) =>
      upsertMediaLinksApi(currentProjectId!, items),
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
    mutationFn: async (items: MediaLink[]) =>
      deleteMediaLinksApi(currentProjectId!, items),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaLinks", currentProjectId],
      });
    },
  });

  const deleteMediaLinks = async (items: MediaLink[]) => {
    await deleteMediaLinksMutation.mutateAsync(items);
  };

  return {
    mediaLinks,
    isLoadingMediaLinks,
    refetchMediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
  };
}
