// project/src/modules/_util/Folders/_store/folders.store.ts
import { createStore } from "@/store/createStore";
import {
  FolderScope,
  EstimationFactDefinition,
  ProjectFolder,
} from "@open-dream/shared";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";

export type SelectedFolder = {
  id: number | null;
  folder_id: string | null;
  scope: FolderScope;
};
export const ROOT_ID = "__root__";

export type ProjectFolderNode = ProjectFolder & {
  children: ProjectFolderNode[];
  items: ProjectFolderNodeItem[];
};

export type ProjectFolderNodeItem =
  | EstimationFactDefinition
  | EstimationProcess;

export type FlatFolderNode = {
  id: string;
  folder_id: number;
  depth: number;
  parentId: number | null;
  node: ProjectFolderNode;
};

export const useFoldersCurrentDataStore = createStore({
  // currentActiveFolder: null as MediaFolder | null,
  currentOpenFolders: new Set<string>([ROOT_ID]),
  folderPXFromTop: 0,
  selectedFolder: null as SelectedFolder | null,
  draggingFolderId: null as string | null,
  draggingFolderDepth: null as number | null,
  flatFolderTreeRef: { current: null as FlatFolderNode[] | null },
  edgeHoverFolderId: null as string | null,
  flatTreesByScope: {} as Record<FolderScope, FlatFolderNode[]>,
});

// export const setCurrentSelectedFolder = (
//   updater:
//     | MediaFolder
//     | null
//     | ((prev: MediaFolder | null) => MediaFolder | null),
// ) =>
//   useFoldersCurrentDataStore.getState().set((state) => ({
//     currentActiveFolder:
//       typeof updater === "function"
//         ? updater(state.currentActiveFolder)
//         : updater,
//   }));

export const setCurrentOpenFolders = (
  updater: Set<string> | ((prev: Set<string>) => Set<string>)
) =>
  useFoldersCurrentDataStore.getState().set((state) => ({
    currentOpenFolders:
      typeof updater === "function"
        ? updater(state.currentOpenFolders)
        : updater,
  }));

export const setFlatTreeForScope = (
  scope: FolderScope,
  flat: FlatFolderNode[]
) =>
  useFoldersCurrentDataStore.getState().set((state) => ({
    flatTreesByScope: {
      ...state.flatTreesByScope,
      [scope]: flat,
    },
  }));
