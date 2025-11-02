// src/context/queryContext/queries/media.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Media } from "@shared/types/models/media";

export function useMedia(isLoggedIn: boolean, currentProjectId: number | null) {
  const queryClient = useQueryClient();

  const {
    data: media = [],
    isLoading: isLoadingMedia,
    refetch: refetchMedia,
  } = useQuery<Media[]>({
    queryKey: ["media", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.get("/api/media", {
        params: { project_idx: currentProjectId },
      });
      return res.data.media || [];
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertMediaMutation = useMutation({
    mutationFn: async (items: Media[]) => {
      const res = await makeRequest.post("/api/media/upsert", {
        project_idx: currentProjectId,
        items,
      });
      return Array.isArray(res.data.media) ? res.data.media : [];
    },

    // 1. Optimistic update
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: ["media", currentProjectId],
      });

      const previousMedia = queryClient.getQueryData<Media[]>([
        "media",
        currentProjectId,
      ]);

      // Optimistically update the cache immediately
      queryClient.setQueryData<Media[]>(
        ["media", currentProjectId],
        (old = []) => {
          const updated = old.map((item) => {
            const idx = data.findIndex(
              (i) => i.media_id === item.media_id
            );
            return idx > -1
              ? { ...item, ordinal: data[idx].ordinal }
              : item;
          });
          return updated.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
        }
      );

      return { previousMedia };
    },

    // 2. If error, roll back
    onError: (_err, _new, context) => {
      if (context?.previousMedia) {
        queryClient.setQueryData(
          ["media", currentProjectId],
          context.previousMedia
        );
      }
    },

    // 3. After success, refetch to confirm
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
    },
  });

  const upsertMedia = async (items: Media[]): Promise<Media[]> => {
    if (!currentProjectId) throw new Error("Project ID is missing");
    return await upsertMediaMutation.mutateAsync(items);
  };

  const deleteMediaMutation = useMutation({
    mutationFn: async (media_id: string) => {
      await makeRequest.post("/api/media/delete", {
        project_idx: currentProjectId,
        media_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
    },
  });

  const deleteMedia = async (media_id: string) => {
    deleteMediaMutation.mutateAsync(media_id);
  };

  return {
    media,
    isLoadingMedia,
    refetchMedia,
    upsertMedia,
    deleteMedia,
  };
}
