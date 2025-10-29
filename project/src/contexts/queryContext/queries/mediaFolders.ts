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

  const upsertMediaFoldersMutation = useMutation({
    mutationFn: async (data: MediaFolder[]) => {
      const res = await makeRequest.post("/api/media/folders/upsert", {
        folders: data,
        project_idx: currentProjectId,
      });
      return res.data.folderIds as number[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    },
  });

  const upsertMediaFolders = async (data: MediaFolder[]) =>
    upsertMediaFoldersMutation.mutateAsync(data);

  const deleteMediaFolderMutation = useMutation({
    mutationFn: async (folder_id: string) => {
      await makeRequest.post("/api/media/folders/delete", {
        project_idx: currentProjectId,
        folder_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    },
  });
  const deleteMediaFolder = async (folder_id: string) =>
    deleteMediaFolderMutation.mutateAsync(folder_id);

  return {
    mediaFolders,
    isLoadingMediaFolders,
    refetchMediaFolders,
    upsertMediaFolders,
    deleteMediaFolder,
  };
}
