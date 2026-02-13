// project/src/context/queryContext/queries/projectFolders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjectFoldersApi,
  upsertProjectFoldersApi,
  deleteProjectFolderApi,
  moveProjectFolderApi,
} from "@/api/projectFolders.api";
import type { FolderInput, FolderScope } from "@open-dream/shared";
import { folderMoveBlockRef } from "@/modules/_util/Folders/_store/folders.store";

export function useProjectFolders(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  params: {
    scope: FolderScope;
    process_id?: number | null;
  }
) {
  const qc = useQueryClient();

  // ---------- FETCH ----------
  const { data: projectFolders = [], isLoading } = useQuery({
    queryKey: [
      "projectFolders",
      currentProjectId,
      params.scope,
      params.process_id ?? null,
    ],
    queryFn: async () =>
      fetchProjectFoldersApi(currentProjectId!, {
        scope: params.scope,
        process_id: params.process_id ?? null,
      }),
    enabled: isLoggedIn && !!currentProjectId,
  });

  // ---------- UPSERT ----------
  const upsertFoldersMutation = useMutation({
    mutationFn: (folders: FolderInput[]) =>
      upsertProjectFoldersApi(currentProjectId!, folders),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: [
          "projectFolders",
          currentProjectId,
          params.scope,
          params.process_id ?? null,
        ],
      }),
  });

  // ---------- DELETE ----------
  const deleteFolderMutation = useMutation({
    mutationFn: (folder_id: string) =>
      deleteProjectFolderApi(currentProjectId!, folder_id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: [
          "projectFolders",
          currentProjectId,
          params.scope,
          params.process_id ?? null,
        ],
      }),
  });

  // ---------- MOVE ----------
  const moveProjectFolderMutation = useMutation({
    mutationFn: (folder: FolderInput) => {
      folderMoveBlockRef.current += 1;
      return moveProjectFolderApi(currentProjectId!, folder);
    },

    onSettled: () => {
      folderMoveBlockRef.current -= 1;

      // only mark false when truly zero
      if (folderMoveBlockRef.current <= 0) {
        folderMoveBlockRef.current = 0;
      }

      qc.invalidateQueries({
        queryKey: [
          "projectFolders",
          currentProjectId,
          params.scope,
          params.process_id ?? null,
        ],
      });
    },
  });

  return {
    projectFolders,
    isLoadingProjectFolders: isLoading,

    upsertProjectFolders: (folders: FolderInput[]) =>
      upsertFoldersMutation.mutateAsync(folders),

    deleteProjectFolder: (folder_id: string) =>
      deleteFolderMutation.mutateAsync(folder_id),

    moveProjectFolder: (folder: FolderInput) =>
      moveProjectFolderMutation.mutateAsync(folder),
  };
}
