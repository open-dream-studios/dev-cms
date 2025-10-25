// project/src/util/functions/Tree.tsx
import { MediaFolder } from "@/types/media";

export type MediaFolderNode = MediaFolder & { children: MediaFolderNode[] };

export function buildFolderTree(
  folders: MediaFolder[],
  parentId: number | null = null
): MediaFolderNode[] {
  return folders
    .filter((f) => f.parent_folder_id === parentId)
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
    .map((f) => ({
      ...f,
      children: buildFolderTree(folders, f.id),
    }));
}

  export function collectParentIds(
    folder: MediaFolder,
    allFolders: MediaFolder[]
  ): number[] {
    const parents: number[] = [];
    let current = folder;

    while (current.parent_folder_id !== null) {
      parents.push(current.parent_folder_id);
      const next = allFolders.find((f) => f.id === current.parent_folder_id);
      if (!next) break;
      current = next;
    }

    return parents;
  }