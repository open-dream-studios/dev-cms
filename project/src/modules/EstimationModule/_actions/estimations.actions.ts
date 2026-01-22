// project/src/modules/EstimationModule/_actions/estimations.actions.tsx
import {
  deleteFactDefinitionApi,
  deleteFactFolderApi,
} from "@/api/estimations/estimationFactDefinitions.api";
import { queryClient } from "@/lib/queryClient";
import { useCurrentDataStore } from "@/store/currentDataStore";
import {
  ContextMenuDefinition,
  EstimationFactDefinition,
  EstimationFactFolder,
} from "@open-dream/shared";
import { useEstimationFactsUIStore } from "../_store/estimations.store";

export const createFactDefinitionContextMenu = (
  onEdit: (fact: EstimationFactDefinition) => void
): ContextMenuDefinition<EstimationFactDefinition> => ({
  items: [
    {
      id: "edit-fact",
      label: "Edit",
      onClick: (fact) => onEdit(fact),
    },
    {
      id: "delete-fact",
      label: "Delete",
      danger: true,
      onClick: async (fact) => {
        await handleDeleteFact(fact.fact_id);
      },
    },
  ],
});

export const handleDeleteFact = async (fact_id: string) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  await deleteFactDefinitionApi(currentProjectId!, fact_id);
  queryClient.invalidateQueries({
    queryKey: ["estimationFactDefinitions", currentProjectId],
  });
};

export const createFactFolderContextMenu = (
  onEdit: (folder: EstimationFactFolder) => void
): ContextMenuDefinition<EstimationFactFolder> => ({
  items: [
    {
      id: "edit-fact",
      label: "Edit",
      onClick: (folder) => onEdit(folder),
    },
    {
      id: "delete-folder",
      label: "Delete",
      danger: true,
      onClick: async (folder) => {
        if (folder.folder_id) {
          await handleDeleteFactFolder(folder.folder_id);
        }
      },
    },
  ],
});

export const handleDeleteFactFolder = async (folder_id: string) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  await deleteFactFolderApi(currentProjectId!, folder_id);
  queryClient.invalidateQueries({
    queryKey: ["estimationFactFolders", currentProjectId],
  });
};

export const toggleFactFolder = (folder: EstimationFactFolder) => {
  const { setSelectedFolderId, set } = useEstimationFactsUIStore.getState();
  const id = folder.folder_id;
  setSelectedFolderId(folder.id);
  set((state) => {
    const next = new Set(state.openFolders);
    next.has(id) ? next.delete(id) : next.add(id);
    return { openFolders: next };
  });
};

export const openFactFolder = (folder: EstimationFactFolder) => {
  const { setSelectedFolderId, set } = useEstimationFactsUIStore.getState();
  const id = folder.folder_id;
  setSelectedFolderId(folder.id);
  set((state) => {
    const next = new Set(state.openFolders);
    next.has(id) ? () => {} : next.add(id);
    return { openFolders: next };
  });
};
