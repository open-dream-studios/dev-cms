// project/src/modules/_util/Folders/_actions/folders.actions.ts
import { deleteProjectFolderApi } from "@/api/projectFolders.api";
import { queryClient } from "@/lib/queryClient";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { ContextMenuDefinition, ProjectFolder } from "@open-dream/shared";
import {
  setSelectedFolderForScope,
  useFoldersCurrentDataStore,
} from "../_store/folders.store";

export const createFolderContextMenu = (
  onEdit: (folder: ProjectFolder) => void
): ContextMenuDefinition<ProjectFolder> => ({
  items: [
    {
      id: "edit-folder",
      label: "Edit",
      onClick: (folder) => onEdit(folder),
    },
    {
      id: "delete-folder",
      label: "Delete",
      danger: true,
      onClick: async (folder) => {
        if (folder.folder_id) {
          await handleDeleteFolder(folder.folder_id);
        }
      },
    },
  ],
});

export const handleDeleteFolder = async (folder_id: string) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  await deleteProjectFolderApi(currentProjectId!, folder_id);
  queryClient.invalidateQueries({
    queryKey: ["projectFolders", currentProjectId],
    exact: false,
  });
};

export const toggleFolder = (folder: ProjectFolder) => {
  const { set } = useFoldersCurrentDataStore.getState();
  const id = folder.folder_id;
  set((state) => {
    const next = new Set(state.currentOpenFolders);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return { currentOpenFolders: next };
  });
};

export const openFolder = (folder: ProjectFolder) => {
  const { set } = useFoldersCurrentDataStore.getState();
  const id = folder.folder_id;
  setSelectedFolderForScope(folder.scope, {
    id: folder.id,
    folder_id: folder.folder_id,
    scope: folder.scope,
  });
  set((state) => {
    const next = new Set(state.currentOpenFolders);
    if (!next.has(id)) next.add(id);
    return { currentOpenFolders: next };
  });
};
