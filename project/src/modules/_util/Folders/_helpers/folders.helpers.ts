// project/src/modules/_util/Folders/_helpers/folder.helpers.ts
import { FolderScope, ProjectFolder } from "@open-dream/shared";
import {
  FlatNode,
  FolderTreeState,
  ProjectFolderNode,
  ProjectFolderNodeItem,
  useFoldersCurrentDataStore,
} from "../_store/folders.store";
import { DragEndEvent } from "@dnd-kit/core";

export function buildFolderTree(
  folders: ProjectFolder[],
  items: ProjectFolderNodeItem[],
  scope: FolderScope
): ProjectFolderNode[] {
  const map = new Map<number, ProjectFolderNode>();

  const ROOT_ID = -1;

  map.set(ROOT_ID, {
    id: ROOT_ID,
    folder_id: "__root__",
    scope,
    name: "ROOT",
    parent_folder_id: null,
    process_id: null,
    ordinal: 0,
    project_idx: 0,
    created_at: "",
    updated_at: "",
    children: [],
    items: [],
  });

  // create folder nodes
  folders.forEach((f) => {
    map.set(f.id, {
      ...f,
      children: [],
      items: [],
    });
  });

  // attach folders to parents
  map.forEach((node) => {
    if (node.id === ROOT_ID) return;

    const parentId =
      node.parent_folder_id !== null && map.has(node.parent_folder_id)
        ? node.parent_folder_id
        : ROOT_ID;

    map.get(parentId)!.children.push(node);
  });

  items.forEach((item) => {
    const parentId = item.folder_id !== null ? item.folder_id : ROOT_ID;
    map.get(parentId)?.items.push(item);
  });

  map.forEach((node) => {
    node.children.sort((a, b) => a.ordinal - b.ordinal);
  });

  const root = map.get(ROOT_ID)!;

  return root.children.length || root.items.length ? [root] : [];
}

export function flattenFolderTree(
  nodes: ProjectFolderNode[],
  openSet: Set<string>,
  depth = 0,
  parentId: number | null = null,
  acc: FlatNode[] = []
) {
  for (const node of nodes) {
    // 1️⃣ push folder
    acc.push({
      type: "folder",
      id: `folder-${node.folder_id}`,
      folder_id: node.id!,
      depth,
      parentId,
      node,
    });

    if (openSet.has(node.folder_id)) {
      // 2️⃣ recurse child folders first
      if (node.children?.length) {
        flattenFolderTree(node.children, openSet, depth + 1, node.id!, acc);
      }

      // 3️⃣ THEN push items
      for (const item of node.items ?? []) {
        acc.push({
          type: "item",
          id: `item-${item.id}`,
          depth: depth + 1,
          parentId: node.id!,
          item,
        });
      }
    }
  }

  return acc;
}

export function collectDescendantFolderIds(
  node: ProjectFolderNode,
  acc: Set<string> = new Set()
): Set<string> {
  for (const child of node.children) {
    acc.add(child.folder_id);
    collectDescendantFolderIds(child, acc);
  }
  return acc;
}

// NEW ATTEMPT
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
  newIndex: number
): FolderTreeState {
  const parentKeyOld = tree.nodesById[folderId].parentId ?? "root";

  const parentKeyNew = newParentId ?? "root";

  const newTree: FolderTreeState = {
    nodesById: { ...tree.nodesById },
    childrenByParent: { ...tree.childrenByParent },
  };

  // ---- REMOVE FROM OLD PARENT ----
  const oldChildren = [...newTree.childrenByParent[parentKeyOld]];
  const filteredOld = oldChildren.filter((id) => id !== folderId);

  newTree.childrenByParent[parentKeyOld] = filteredOld;

  filteredOld.forEach((id, i) => {
    newTree.nodesById[id] = {
      ...newTree.nodesById[id],
      ordinal: i,
    };
  });

  // ---- INSERT INTO NEW PARENT ----
  const targetChildren = [...(newTree.childrenByParent[parentKeyNew] ?? [])];

  const before = targetChildren.slice(0, newIndex);
  const after = targetChildren.slice(newIndex);

  const updated = [...before, folderId, ...after];

  newTree.childrenByParent[parentKeyNew] = updated;

  updated.forEach((id, i) => {
    newTree.nodesById[id] = {
      ...newTree.nodesById[id],
      ordinal: i,
      parentId: newParentId,
    };
  });

  return newTree;
}

export function computeDropTarget(
  e: DragEndEvent,
  tree: FolderTreeState,
  edgeHoverFolderId: string | null
): { newParentId: number | null; newIndex: number } | null {
  console.log("COMPUTE_DROP_TARGET", {
    edgeHoverFolderId,
    over: e.over?.id,
  });

  const activeData = e.active.data.current;
  if (activeData?.kind !== "FOLDER") return null;

  const draggedId = activeData.folder.id;

  // ----------------------------------
  // CASE 1 — DROP ONTO FOLDER (append)
  // ----------------------------------
  if (edgeHoverFolderId && edgeHoverFolderId !== "__root__") {
    const target = Object.values(tree.nodesById).find(
      (n) => n.folder_id === edgeHoverFolderId
    );
    console.log("case1", target);
    if (!target) return null;
    console.log("CASE_1_APPEND", { newParentId: target.id });

    if (target.id === draggedId) return null;

    const siblings = tree.childrenByParent[target.id] ?? [];

    return {
      newParentId: target.id,
      newIndex: siblings.length,
    };
  }

  // ----------------------------------
  // CASE 2 — DROP BASED ON FLAT ORDER
  // ----------------------------------

  const overData = e.over?.data.current;
  if (!overData || overData.kind !== "FOLDER") return null;

  const overId = overData.folder.id;

  // find flat list order
  const flat = flattenFromNormalizedTree(
    tree,
    useFoldersCurrentDataStore.getState().currentOpenFolders
  );
  const overIndex = flat.findIndex(
    (f) => f.type === "folder" && f.folder_id === overId
  );

  if (overIndex === -1) return null;

  const overNode = flat[overIndex];

  if (overNode.type !== "folder") return null;

  const newParentId = overNode.parentId ?? null;

  const siblings = tree.childrenByParent[newParentId ?? "root"] ?? [];

  const newIndex = siblings.indexOf(overNode.folder_id);

  return {
    newParentId,
    newIndex,
  };
}
