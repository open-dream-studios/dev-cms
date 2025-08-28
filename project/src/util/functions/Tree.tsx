// project/src/util/functions/Tree.tsx
import { MediaFolder } from "@/types/media";

export type MediaFolderNode = MediaFolder & { children: MediaFolderNode[] };

export function buildFolderTree(
  folders: MediaFolder[],
  parentId: number | null = null
): MediaFolderNode[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
    .map((f) => ({
      ...f,
      children: buildFolderTree(folders, f.id),
    }));
}