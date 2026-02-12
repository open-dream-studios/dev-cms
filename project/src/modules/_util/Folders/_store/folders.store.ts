// project/src/modules/_util/Folders/_store/folders.store.ts
import { createStore } from "@/store/createStore";
import {
  FolderScope,
  EstimationFactDefinition,
  ProjectFolder,
  folderScopes,
} from "@open-dream/shared";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import { useEstimationsUIStore } from "@/modules/EstimationModule/_store/estimations.store";

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

// NEW ATTEMPT
export type FolderTreeState = {
  nodesById: Record<
    number,
    {
      id: number;
      folder_id: string;
      parentId: number | null;
      ordinal: number;
      name: string;
    }
  >;
  childrenByParent: Record<number | "root", number[]>;
};

export type FlatNode =
  | {
      type: "folder";
      id: string;
      folder_id: number;
      depth: number;
      parentId: number | null;
      node: ProjectFolderNode;
    }
  | {
      type: "item";
      id: string;
      depth: number;
      parentId: number | null;
      item: ProjectFolderNodeItem;
    };

export const useFoldersCurrentDataStore = createStore({
  // currentActiveFolder: null as MediaFolder | null,
  currentOpenFolders: new Set<string>([ROOT_ID]),
  folderPXFromTop: 0,
  // selectedFolder: null as SelectedFolder | null,
  draggingFolderId: null as string | null,
  draggingFolderDepth: null as number | null,
  flatFolderTreeRef: { current: null as FlatNode[] | null },
  edgeHoverFolderId: null as string | null,
  flatTreesByScope: {} as Record<FolderScope, FlatNode[]>,

  // NEW ATTEMPT
  folderTreesByScope: {} as Record<FolderScope, FolderTreeState>,
  selectedFoldersByScope: {} as Record<FolderScope, SelectedFolder | null>,
});

export const setCurrentOpenFolders = (
  updater: Set<string> | ((prev: Set<string>) => Set<string>)
) =>
  useFoldersCurrentDataStore.getState().set((state) => ({
    currentOpenFolders:
      typeof updater === "function"
        ? updater(state.currentOpenFolders)
        : updater,
  }));

export const setFlatTreeForScope = (scope: FolderScope, flat: FlatNode[]) =>
  useFoldersCurrentDataStore.getState().set((state) => ({
    flatTreesByScope: {
      ...state.flatTreesByScope,
      [scope]: flat,
    },
  }));

// NEW ATTEMPT
export const setFolderTreeByScope = (
  scope: FolderScope,
  tree: FolderTreeState
) =>
  useFoldersCurrentDataStore.getState().set((state) => ({
    folderTreesByScope: {
      ...state.folderTreesByScope,
      [scope]: tree,
    },
  }));

export const setSelectedFolderForScope = (
  scope: FolderScope,
  folder: SelectedFolder | null
) =>
  useFoldersCurrentDataStore.getState().set((state) => ({
    selectedFoldersByScope: {
      ...state.selectedFoldersByScope,
      [scope]: folder,
    },
  }));

export const clearSelectedFolders = () => {
  const clearedScopes = folderScopes.reduce<Record<string, null>>(
    (acc, scope) => {
      acc[scope] = null;
      return acc;
    },
    {}
  );
  useFoldersCurrentDataStore.getState().set((state) => ({
    selectedFoldersByScope: {
      ...state.selectedFoldersByScope,
      ...clearedScopes,
    },
  }));
};

export const resetDragUI = () => {
  const { setDraggingFolderId, setDraggingFolderDepth, setEdgeHoverFolderId } =
    useFoldersCurrentDataStore.getState();
  const { setDraggingFact, setDraggingProcess } =
    useEstimationsUIStore.getState();

  setDraggingFact(null);
  setDraggingProcess(null);

  setDraggingFolderId(null);
  setDraggingFolderDepth(null);
  setEdgeHoverFolderId(null);
};
