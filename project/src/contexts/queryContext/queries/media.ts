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

  const addMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      await makeRequest.post("/api/media/add", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
    },
  });
  const addMedia = async (file: any) => addMediaMutation.mutateAsync(file);

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: number) => {
      await makeRequest.post("/api/media/delete", {
        project_idx: currentProjectId,
        id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
    },
  });

  const deleteMedia = async (id: number) => {
    deleteMediaMutation.mutateAsync(id);
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
        const idx = variables.orderedIds.indexOf(m.id);
        if (idx === -1 || m.ordinal === idx) return m; // keep old ref
        return { ...m, ordinal: idx }; // only new object if ordinal changed
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
          const idx = variables.orderedIds.indexOf(m.id);
          return idx === -1 || m.ordinal === idx ? m : { ...m, ordinal: idx };
        });
      });
    },
  });

  const reorderMedia = async (data: {
    folder_id: number | null;
    orderedIds: number[];
  }) => reorderMediaMutation.mutateAsync(data);

  return { media, isLoadingMedia, refetchMedia, addMedia, deleteMedia, reorderMedia }
}
