// project/src/context/queryContext/queries/projectFolders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjectFoldersApi,
  upsertProjectFoldersApi,
  deleteProjectFolderApi, 
  moveProjectFolderApi,
} from "@/api/projectFolders.api";
import type { FolderInput, FolderScope } from "@open-dream/shared";

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
    queryFn: () =>
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
    mutationFn: (folder: FolderInput) =>
      moveProjectFolderApi(currentProjectId!, folder),
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
  
  //   const moveProjectFolderMutation = useMutation({
  //   mutationFn: (folder: FolderInput) =>
  //     moveProjectFolderApi(currentProjectId!, folder),
  // });

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
