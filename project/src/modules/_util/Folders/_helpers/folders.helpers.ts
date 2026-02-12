// project/src/modules/_util/Folders/_helpers/folder.helpers.ts
import { FolderScope, ProjectFolder } from "@open-dream/shared";
import {
  FlatNode,
  FolderTreeState, 
  useFoldersCurrentDataStore,
} from "../_store/folders.store"; 

export function buildNormalizedTree(folders: ProjectFolder[]): FolderTreeState {
  const nodesById: FolderTreeState["nodesById"] = {};
  const childrenByParent = {
    root: [],
  } as Record<number | "root", number[]>;

  // ensure root bucket exists
  childrenByParent["root"] = [];

  // 1️⃣ create nodes
  for (const f of folders) {
    nodesById[f.id] = {
      id: f.id,
      folder_id: f.folder_id,
      parentId: f.parent_folder_id ?? null,
      ordinal: f.ordinal ?? 0,
      name: f.name,
    };
  }

  // 2️⃣ initialize parent buckets
  for (const f of folders) {
    const parentKey = f.parent_folder_id ?? "root";
    if (!childrenByParent[parentKey]) {
      childrenByParent[parentKey] = [];
    }
  }

  // 3️⃣ push children into parents
  for (const f of folders) {
    const parentKey = f.parent_folder_id ?? "root";
    childrenByParent[parentKey].push(f.id);
  }

  // 4️⃣ sort each parent's children by ordinal
  for (const key in childrenByParent) {
    childrenByParent[key].sort((a, b) => {
      return nodesById[a].ordinal - nodesById[b].ordinal;
    });
  }

  // 5️⃣ reindex ordinals safely (guarantee no gaps)
  for (const key in childrenByParent) {
    childrenByParent[key].forEach((id, index) => {
      nodesById[id].ordinal = index;
    });
  }

  return {
    nodesById,
    childrenByParent,
  };
}

export function flattenFromNormalizedTree(
  tree: FolderTreeState,
  openSet: Set<string>
): FlatNode[] {
  const acc: FlatNode[] = [];

  function walk(parentKey: number | "root", depth: number) {
    const children = tree.childrenByParent[parentKey];
    if (!children?.length) return;

    for (const id of children) {
      const node = tree.nodesById[id];

      acc.push({
        type: "folder",
        id: `folder-${node.folder_id}`,
        folder_id: node.id,
        depth,
        parentId: node.parentId,
        node: {
          ...node,
          children: [],
          items: [],
        } as any,
      });

      if (openSet.has(node.folder_id)) {
        walk(id, depth + 1);
      }
    }
  }

  walk("root", 0);

  return acc;
}

export const closeFolderTreeBranch = (
  scope: FolderScope,
  folderNumericId: number
) =>
  useFoldersCurrentDataStore.getState().set((state) => {
    const tree = state.folderTreesByScope[scope];
    if (!tree) return {};
    const next = new Set(state.currentOpenFolders);
    const walk = (parentId: number) => {
      const children = tree.childrenByParent[parentId];
      if (!children?.length) return;
      for (const childId of children) {
        const childNode = tree.nodesById[childId];
        next.delete(childNode.folder_id);
        walk(childId);
      }
    };
    const node = tree.nodesById[folderNumericId];
    if (!node) return {};
    next.delete(node.folder_id);
    walk(folderNumericId);
    return {
      currentOpenFolders: next,
    };
  });

export function moveFolderLocal(
  tree: FolderTreeState,
  folderId: number,
  newParentId: number | null,
  targetOrdinal: number
): FolderTreeState {
  const node = tree.nodesById[folderId];
  if (!node) return tree;

  const oldParentKey = node.parentId ?? "root";
  const newParentKey = newParentId ?? "root";

  const newTree: FolderTreeState = {
    nodesById: { ...tree.nodesById },
    childrenByParent: { ...tree.childrenByParent },
  };

  const oldSiblings = [...(newTree.childrenByParent[oldParentKey] ?? [])];
  const newSiblings =
    oldParentKey === newParentKey
      ? oldSiblings
      : [...(newTree.childrenByParent[newParentKey] ?? [])];

  const oldOrdinal = node.ordinal;

  const movingWithinSameLayer = oldParentKey === newParentKey;

  // ----------------------------
  // REMOVE FROM OLD LAYER
  // ----------------------------
  const filteredOld = oldSiblings.filter((id) => id !== folderId);
  newTree.childrenByParent[oldParentKey] = filteredOld;

  filteredOld.forEach((id, i) => {
    newTree.nodesById[id] = {
      ...newTree.nodesById[id],
      ordinal: i,
    };
  });

  // ----------------------------
  // INSERT INTO TARGET LAYER
  // ----------------------------
  const targetChildren =
    movingWithinSameLayer
      ? filteredOld
      : newSiblings;

  const before = targetChildren.slice(0, targetOrdinal);
  const after = targetChildren.slice(targetOrdinal);

  const updated = [...before, folderId, ...after];

  newTree.childrenByParent[newParentKey] = updated;

  updated.forEach((id, i) => {
    newTree.nodesById[id] = {
      ...newTree.nodesById[id],
      ordinal: i,
      parentId: newParentId,
    };
  });

  return newTree;
}

 