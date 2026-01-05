// project/src/context/queryContext/queries/mediaFolders.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MediaFolder } from "@open-dream/shared";
import {
  deleteMediaFolderApi,
  fetchMediaFoldersApi,
  upsertMediaFoldersApi,
} from "@/api/mediaFolders.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function useMediaFolders(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: mediaFolders = [],
    isLoading: isLoadingMediaFolders,
    refetch: refetchMediaFolders,
  } = useQuery<MediaFolder[]>({
    queryKey: ["mediaFolders", currentProjectId],
    queryFn: async () => fetchMediaFoldersApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !isPublic
  });

  const upsertMediaFoldersMutation = useMutation({
    mutationFn: (folders: MediaFolder[]) =>
      upsertMediaFoldersApi(currentProjectId!, folders),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    },
  });

  const deleteMediaFolderMutation = useMutation({
    mutationFn: (folderId: string) =>
      deleteMediaFolderApi(currentProjectId!, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    },
  });

  const upsertMediaFolders = async (folders: MediaFolder[]) =>
    upsertMediaFoldersMutation.mutateAsync(folders);

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
