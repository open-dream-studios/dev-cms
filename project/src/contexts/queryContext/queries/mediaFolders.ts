// project/src/context/queryContext/queries/mediaFolders.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { MediaFolder } from "@/types/media";

export function useMediaFolders(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: mediaFolders = [],
    isLoading: isLoadingMediaFolders,
    refetch: refetchMediaFolders,
  } = useQuery<MediaFolder[]>({
    queryKey: ["mediaFolders", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.get("/api/media/folders", {
        params: { project_idx: currentProjectId },
      });
      return res.data.mediaFolders || [];
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertMediaFolderMutation = useMutation({
    mutationFn: async (data: {
      project_idx: number;
      parent_id?: number | null;
      name: string;
    }) => {
      const res = await makeRequest.post("/api/media/folders/upsert", data);
      return res.data.id as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    },
  });
  const upsertMediaFolder = async (data: {
    project_idx: number;
    parent_id?: number | null;
    name: string;
  }) => upsertMediaFolderMutation.mutateAsync(data);

  const deleteMediaFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      await makeRequest.post("/api/media/folders/delete", {
        project_idx: currentProjectId,
        folder_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    },
  });
  const deleteMediaFolder = async (id: number) =>
    deleteMediaFolderMutation.mutateAsync(id);

  const reorderMediaFoldersMutation = useMutation({
    mutationFn: async (data: {
      parent_id: number | null;
      orderedIds: number[];
    }) => {
      await makeRequest.post("/api/media/folders/reorder", {
        project_idx: currentProjectId,
        parent_id: data.parent_id,
        orderedIds: data.orderedIds,
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
      const prevFolders =
        queryClient.getQueryData<MediaFolder[]>([
          "mediaFolders",
          currentProjectId,
        ]) || [];
      const reordered = [...prevFolders].map((f) =>
        variables.orderedIds.includes(f.id)
          ? { ...f, ordinal: variables.orderedIds.indexOf(f.id) }
          : f
      );
      queryClient.setQueryData(["mediaFolders", currentProjectId], reordered);
      return { prevFolders };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevFolders) {
        queryClient.setQueryData(
          ["mediaFolders", currentProjectId],
          context.prevFolders
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    },
  });
  const reorderMediaFolders = async (data: {
    parent_id: number | null;
    orderedIds: number[];
  }) => reorderMediaFoldersMutation.mutateAsync(data);

  const renameMediaFolderMutation = useMutation({
    mutationFn: async (data: { folder_id: number; name: string }) => {
      await makeRequest.post("/api/media/folders/rename", {
        project_idx: currentProjectId,
        ...data,
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });

      const prevFolders =
        queryClient.getQueryData<MediaFolder[]>([
          "mediaFolders",
          currentProjectId,
        ]) || [];

      // Optimistically update
      queryClient.setQueryData<MediaFolder[]>(
        ["mediaFolders", currentProjectId],
        (old) =>
          old
            ? old.map((f) =>
                f.id === variables.folder_id
                  ? { ...f, name: variables.name }
                  : f
              )
            : []
      );

      return { prevFolders };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevFolders) {
        queryClient.setQueryData(
          ["mediaFolders", currentProjectId],
          context.prevFolders
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    },
  });
  const renameMediaFolder = async (data: { folder_id: number; name: string }) =>
    renameMediaFolderMutation.mutateAsync(data);

  return { mediaFolders, isLoadingMediaFolders, refetchMediaFolders, upsertMediaFolder, deleteMediaFolder, renameMediaFolder, reorderMediaFolders }
}
