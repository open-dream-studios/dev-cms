// project/src/context/queryContext/queries/estimations/estimationFactDefinitions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteFactDefinitionApi,
  fetchFactDefinitionsApi,
  upsertFactDefinitionApi,
  fetchFactFoldersApi,
  upsertFactFoldersApi,
  deleteFactFolderApi,
} from "@/api/estimations/estimationFactDefinitions.api";
import type { FactType, EstimationFactFolder } from "@open-dream/shared";

export function useEstimationFactDefinitions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const qc = useQueryClient();

  // ---------- FACTS ----------
  const { data: factDefinitions = [], isLoading } = useQuery({
    queryKey: ["estimationFactDefinitions", currentProjectId],
    queryFn: () => fetchFactDefinitionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: {
      fact_id?: string | null;
      fact_key: string;
      fact_type: FactType;
      description?: string | null;
      folder_id?: number | null;
      process_id: number;
    }) => upsertFactDefinitionApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId],
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (fact_id: string) =>
      deleteFactDefinitionApi(currentProjectId!, fact_id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId],
      }),
  });

  // ---------- FOLDERS ----------
  const { data: factFolders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["estimationFactFolders", currentProjectId],
    queryFn: () => fetchFactFoldersApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertFoldersMutation = useMutation({
    mutationFn: (folders: {
      folder_id?: string | null;
      parent_folder_id?: number | null;
      name: string;
      ordinal?: number | null;
    }[]) => upsertFactFoldersApi(currentProjectId!, folders),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactFolders", currentProjectId],
      }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folder_id: string) =>
      deleteFactFolderApi(currentProjectId!, folder_id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactFolders", currentProjectId],
      }),
  });

  return {
    // facts
    factDefinitions,
    isLoadingFactDefinitions: isLoading,
    upsertFactDefinition: (p: {
      fact_id?: string | null;
      fact_key: string;
      fact_type: FactType;
      description?: string | null;
      folder_id?: number | null;
      process_id: number;
    }) => upsertMutation.mutateAsync(p),
    deleteFactDefinition: (fact_id: string) =>
      deleteMutation.mutateAsync(fact_id),

    // folders
    factFolders: factFolders as EstimationFactFolder[],
    isLoadingFactFolders: isLoadingFolders,
    upsertFactFolders: (folders: {
      folder_id?: string | null;
      parent_folder_id?: number | null;
      name: string;
      ordinal?: number | null;
    }[]) => upsertFoldersMutation.mutateAsync(folders),
    deleteFactFolder: (folder_id: string) =>
      deleteFolderMutation.mutateAsync(folder_id),
  };
}