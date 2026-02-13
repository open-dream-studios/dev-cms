// project/src/modules/_util/Folders/_helpers/folder.helpers.ts
import { FolderScope, ProjectFolder } from "@open-dream/shared";
import {
  FlatNode,
  FolderTreeState,
  ProjectFolderNodeItem,
  useFoldersCurrentDataStore,
} from "../_store/folders.store";
import { closestCenter } from "@dnd-kit/core";

export function treesEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function buildNormalizedTree(
  folders: ProjectFolder[],
  items: ProjectFolderNodeItem[]
): FolderTreeState {
  const nodesById: FolderTreeState["nodesById"] = {};
  const childrenByParent: Record<number | "root", number[]> = {
    root: [],
  };

  const itemsByParent: Record<number | "root", ProjectFolderNodeItem[]> = {
    root: [],
  };

  // 1️⃣ create folder nodes
  for (const f of folders) {
    nodesById[f.id] = {
      id: f.id,
      folder_id: f.folder_id,
      parentId: f.parent_folder_id ?? null,
      ordinal: f.ordinal ?? 0,
      name: f.name,
    };
  }

  // 2️⃣ ensure parent buckets exist
  for (const f of folders) {
    const parentKey = f.parent_folder_id ?? "root";
    if (!childrenByParent[parentKey]) {
      childrenByParent[parentKey] = [];
    }
    if (!itemsByParent[parentKey]) {
      itemsByParent[parentKey] = [];
    }
  }

  // 3️⃣ attach folders to parents
  for (const f of folders) {
    const parentKey = f.parent_folder_id ?? "root";
    childrenByParent[parentKey].push(f.id);
  }

  // 4️⃣ attach items to parents
  for (const item of items) {
    const parentKey = item.folder_id ?? "root";
    if (!itemsByParent[parentKey]) {
      itemsByParent[parentKey] = [];
    }
    itemsByParent[parentKey].push(item);
  }

  // 5️⃣ sort folders by ordinal
  for (const key in childrenByParent) {
    childrenByParent[key].sort((a, b) => {
      return nodesById[a].ordinal - nodesById[b].ordinal;
    });
  }

  // 6️⃣ reindex ordinals safely
  for (const key in childrenByParent) {
    childrenByParent[key].forEach((id, index) => {
      nodesById[id].ordinal = index;
    });
  }

  return {
    nodesById,
    childrenByParent,
    itemsByParent,
  };
}

export function flattenFromNormalizedTree(
  tree: FolderTreeState,
  openSet: Set<string>
): FlatNode[] {
  const acc: FlatNode[] = [];

  function walk(parentKey: number | "root", depth: number) {
    const children = tree.childrenByParent[parentKey];
    if (!children?.length && !tree.itemsByParent[parentKey]?.length) return;

    // 1️⃣ folders first
    for (const id of children ?? []) {
      const node = tree.nodesById[id];

      acc.push({
        type: "folder",
        id: `folder-${node.folder_id}`,
        folder_id: node.id,
        depth,
        parentId: node.parentId,
        node: {
          ...node,
        } as any,
      });

      if (openSet.has(node.folder_id)) {
        walk(id, depth + 1);
      }
    }

    // 2️⃣ then items
    for (const item of tree.itemsByParent?.[parentKey] ?? []) {
      acc.push({
        type: "item",
        id: `item-${item.id}`,
        depth,
        parentId: parentKey === "root" ? null : parentKey,
        item,
      });
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
    itemsByParent: { ...tree.itemsByParent },
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
  const targetChildren = movingWithinSameLayer ? filteredOld : newSiblings;

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

export const folderDndCollisions = (args: any) => {
  const { droppableContainers, pointerCoordinates } = args;

  if (!pointerCoordinates) return [];

  const folders = droppableContainers.filter(
    (c: any) => c.data.current?.kind === "FOLDER"
  );

  if (!folders.length) return [];
  const insideFolder = folders.filter((c: any) => {
    const rect = c.rect.current;
    if (!rect) return false;
    return (
      pointerCoordinates.y >= rect.top && pointerCoordinates.y <= rect.bottom
    );
  });

  if (insideFolder.length) {
    return closestCenter({
      ...args,
      droppableContainers: insideFolder,
    });
  }

  // Otherwise: lock to folder ABOVE pointer (never switch halfway)
  const sorted = folders
    .map((c: any) => ({
      id: c.id,
      rect: c.rect.current!,
    }))
    .sort((a: any, b: any) => a.rect.top - b.rect.top);

  let target = sorted[0];

  for (let i = 0; i < sorted.length; i++) {
    if (pointerCoordinates.y < sorted[i].rect.top) {
      target = sorted[Math.max(0, i - 1)];
      break;
    }
    target = sorted[i];
  }

  return target ? [{ id: target.id }] : [];
};
