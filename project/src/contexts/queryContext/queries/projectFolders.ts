// project/src/context/queryContext/queries/projectFolders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjectFoldersApi,
  upsertProjectFoldersApi,
  deleteProjectFolderApi,
  moveProjectFolderApi,
} from "@/api/projectFolders.api";
import type { FolderInput, FolderScope } from "@open-dream/shared";
import {
  setFolderTreeByScope,
  useFoldersCurrentDataStore,
} from "@/modules/_util/Folders/_store/folders.store";
import { buildNormalizedTree } from "@/modules/_util/Folders/_helpers/folders.helpers";
import { useRef } from "react";

export function useProjectFolders(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  params: {
    scope: FolderScope;
    process_id?: number | null;
  }
) {
  const qc = useQueryClient();
  const {
    movePending,
    setMovePending,
    draggingFolderId,
    setPendingServerSnapshot,
  } = useFoldersCurrentDataStore();
  const movePendingRef = useRef<number>(0);

  // ---------- FETCH ----------
  const { data: projectFolders = [], isLoading } = useQuery({
    queryKey: [
      "projectFolders",
      currentProjectId,
      params.scope,
      params.process_id ?? null,
    ],
    queryFn: async () => {
      const newFolders = await fetchProjectFoldersApi(currentProjectId!, {
        scope: params.scope,
        process_id: params.process_id ?? null,
      }); 
      const isBlocked = draggingFolderId || movePendingRef.current > 0;
      if (isBlocked) {
        setPendingServerSnapshot(newFolders);
      } else {
        const tree = buildNormalizedTree(newFolders);
        setFolderTreeByScope(params.scope, tree);
        setPendingServerSnapshot(null);
      }
      return newFolders;
    },
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
      movePendingRef.current += 1;
      setMovePending(movePending + 1);
      return moveProjectFolderApi(currentProjectId!, folder);
    },

    onSettled: () => {
      movePendingRef.current -= 1;
      setMovePending(movePending - 1);

      // only mark false when truly zero
      if (movePendingRef.current <= 0) {
        movePendingRef.current = 0;
        setMovePending(0);
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
