// project/src/context/queryContext/queries/estimations/estimationFactDefinitions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteFactDefinitionApi,
  fetchFactDefinitionsApi,
  upsertFactDefinitionApi,
  fetchFactFoldersApi,
  upsertFactFoldersApi,
  deleteFactFolderApi,
  reorderFactDefinitionsApi,
  reorderFactFoldersApi,
  upsertEnumOptionApi,
  deleteEnumOptionApi,
  reorderEnumOptionsApi,
} from "@/api/estimations/estimationFactDefinitions.api";
import type { FactType, EstimationFactFolder } from "@open-dream/shared";

export function useEstimationFactDefinitions(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  process_id: number | null
) {
  const qc = useQueryClient();

  // ---------- FACTS ----------
  const { data: factDefinitions = [], isLoading } = useQuery({
    queryKey: ["estimationFactDefinitions", currentProjectId, process_id],
    queryFn: () => fetchFactDefinitionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !!process_id,
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: {
      fact_id?: string | null;
      fact_key: string;
      fact_type: FactType;
      variable_scope: "fact" | "geometric" | "project";
      description?: string | null;
      folder_id?: number | null;
      process_id: number;
    }) => upsertFactDefinitionApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId, process_id],
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (fact_id: string) =>
      deleteFactDefinitionApi(currentProjectId!, fact_id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId, process_id],
      }),
  });

  const reorderFactsMutation = useMutation({
    mutationFn: (payload: {
      process_id: number;
      parent_folder_id?: number | null;
      orderedIds: string[];
    }) => reorderFactDefinitionsApi(currentProjectId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId, process_id],
      });
    },
  });

  // ---------- FOLDERS ----------
  const { data: factFolders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["estimationFactFolders", currentProjectId],
    queryFn: () => fetchFactFoldersApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertFoldersMutation = useMutation({
    mutationFn: (
      folders: {
        folder_id?: string | null;
        parent_folder_id?: number | null;
        name: string;
        ordinal?: number | null;
      }[]
    ) => upsertFactFoldersApi(currentProjectId!, folders),
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

  const reorderFoldersMutation = useMutation({
    mutationFn: (payload: {
      process_id: number;
      parent_folder_id?: number | null;
      orderedIds: string[];
    }) => reorderFactFoldersApi(currentProjectId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["estimationFactFolders", currentProjectId],
      });
    },
  });

  // ------- ENUM -----
  const upsertEnumOptionMutation = useMutation({
    mutationFn: (payload: {
      fact_definition_idx: number;
      option: {
        option_id?: string;
        label: string;
        value: string;
      };
    }) => upsertEnumOptionApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId, process_id],
      }),
  });

  const deleteEnumOptionMutation = useMutation({
    mutationFn: (option_id: string) =>
      deleteEnumOptionApi(currentProjectId!, option_id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId, process_id],
      }),
  });

  const reorderEnumOptionsMutation = useMutation({
    mutationFn: (payload: {
      fact_definition_idx: number;
      orderedOptionIds: string[];
    }) => reorderEnumOptionsApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId, process_id],
      }),
  });

  return {
    // ---------- FACTS ----------
    factDefinitions,
    isLoadingFactDefinitions: isLoading,
    upsertFactDefinition: (p: any) => upsertMutation.mutateAsync(p),
    deleteFactDefinition: (fact_id: string) =>
      deleteMutation.mutateAsync(fact_id),

    reorderFactDefinitions: (payload: {
      process_id: number;
      parent_folder_id?: number | null;
      orderedIds: string[];
    }) => reorderFactsMutation.mutateAsync(payload),

    // ---------- FOLDERS ----------
    factFolders: factFolders as EstimationFactFolder[],
    isLoadingFactFolders: isLoadingFolders,
    upsertFactFolders: (folders: any) =>
      upsertFoldersMutation.mutateAsync(folders),
    deleteFactFolder: (folder_id: string) =>
      deleteFolderMutation.mutateAsync(folder_id),

    reorderFactFolders: (payload: {
      process_id: number;
      parent_folder_id?: number | null;
      orderedIds: string[];
    }) => reorderFoldersMutation.mutateAsync(payload),

    // ---------- ENUM OPTIONS ----------
    upsertEnumOption: (p: {
      fact_definition_idx: number;
      option: {
        option_id?: string;
        label: string;
        value: string;
      };
    }) => upsertEnumOptionMutation.mutateAsync(p),

    deleteEnumOption: (option_id: string) =>
      deleteEnumOptionMutation.mutateAsync(option_id),

    reorderEnumOptions: (p: {
      fact_definition_idx: number;
      orderedOptionIds: string[];
    }) => reorderEnumOptionsMutation.mutateAsync(p),
  };
}
