// project/src/modules/MediaModule/_actions/media.actions.ts
import { useCurrentDataStore } from "@/store/currentDataStore";
import { ContextMenuDefinition, MediaFolder } from "@open-dream/shared";
import { QueryClient } from "@tanstack/react-query";
import { useMediaModuleUIStore } from "../_store/media.store";
import { deleteMediaFolderApi } from "@/api/mediaFolders.api";

export const createFolderContextMenu = (
  queryClient: QueryClient
): ContextMenuDefinition<MediaFolder> => ({
  items: [
    {
      id: "delete-folder",
      label: "Delete Folder",
      danger: true,
      onClick: async (folder) => {
        await handleDeleteFolder(queryClient, folder.folder_id);
      },
    },
    {
      id: "rename-folder",
      label: "Rename Folder",
      danger: true,
      onClick: async (folder) => {
        await handleRenameFolder(folder.folder_id);
      },
    },
  ],
});

export const handleDeleteFolder = async (
  queryClient: QueryClient,
  folder_id: string | null
) => {
  const { currentProjectId, setCurrentActiveFolder, currentActiveFolder } =
    useCurrentDataStore.getState();
  if (!currentProjectId || !folder_id) return;
  await deleteMediaFolderApi(currentProjectId, folder_id);
  if (currentActiveFolder && currentActiveFolder.folder_id === folder_id) {
    setCurrentActiveFolder(null);
  }
  queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
  queryClient.invalidateQueries({
    queryKey: ["mediaFolders", currentProjectId],
  });
};

const handleRenameFolder = async (folder_id: string | null) => {
  if (!folder_id) return;
  const { setRenamingFolder } = useMediaModuleUIStore.getState();
  setRenamingFolder(folder_id);
};
