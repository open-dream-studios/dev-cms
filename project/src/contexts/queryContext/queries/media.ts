// src/context/queryContext/queries/media.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Media } from "@/types/media";

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

  const upsertMediaMutation = useMutation<
    Media[],
    Error,
    { project_idx: number; items: Media[] }
  >({
    mutationFn: async (data) => {
      const res = await makeRequest.post("/api/media/upsert", data);
      return Array.isArray(res.data.media) ? res.data.media : [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
    },
  });

  const upsertMedia = async (items: Media[]): Promise<Media[]> => {
    if (!currentProjectId) throw new Error("Project ID is missing");
    return await upsertMediaMutation.mutateAsync({
      project_idx: currentProjectId,
      items,
    });
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

  const reorderMediaMutation = useMutation({
    mutationFn: async (data: {
      folder_id: number | null;
      orderedIds: number[];
    }) => {
      await makeRequest.post("/api/media/reorder", {
        project_idx: currentProjectId,
        folder_id: data.folder_id,
        orderedIds: data.orderedIds,
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["media", currentProjectId],
      });

      const prevMedia =
        queryClient.getQueryData<Media[]>(["media", currentProjectId]) || [];
      const reordered = prevMedia.map((m) => {
        if (!m.id) return null;
        const idx = variables.orderedIds.indexOf(m.id);
        if (idx === -1 || m.ordinal === idx) return m;
        return { ...m, ordinal: idx };
      });
      queryClient.setQueryData(["media", currentProjectId], reordered);
      return { prevMedia };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevMedia) {
        queryClient.setQueryData(
          ["media", currentProjectId],
          context.prevMedia
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<Media[]>(["media", currentProjectId], (old) => {
        if (!old) return old;
        return old.map((m) => {
          const idx = m.id ? variables.orderedIds.indexOf(m.id) : -1;
          return idx === -1 || m.ordinal === idx ? m : { ...m, ordinal: idx };
        });
      });
    },
  });

  const reorderMedia = async (data: {
    folder_id: number | null;
    orderedIds: number[];
  }) => reorderMediaMutation.mutateAsync(data);

  return {
    media,
    isLoadingMedia,
    refetchMedia,
    upsertMedia,
    deleteMedia,
    reorderMedia,
  };
}
