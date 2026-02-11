// project/src/modules/_util/Folders/_helpers/folder.helpers.ts
import { FolderScope, ProjectFolder } from "@open-dream/shared";
import { FlatFolderNode, ProjectFolderNode, ProjectFolderNodeItem } from "../_store/folders.store";

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
  acc: FlatFolderNode[] = []
) {
  for (const node of nodes) {
    acc.push({
      id: `folder-${node.folder_id}`,
      folder_id: node.id!,
      depth,
      parentId,
      node,
    });

    if (openSet.has(node.folder_id) && node.children?.length) {
      flattenFolderTree(node.children, openSet, depth + 1, node.id!, acc);
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

