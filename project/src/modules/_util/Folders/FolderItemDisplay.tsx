// project/src/modules/_util/Folders/DraggableFolderItemDisplay.tsx
"use client";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { ChevronRight, ChevronDown, Folder, GripVertical } from "lucide-react";
import { ProjectFolderNode, useFoldersCurrentDataStore } from "./_store/folders.store";

export const FolderItemDisplay = ({
  isGhost,
  node,
  name,
  depth,
  listeners,
  outline,
}: {
  isGhost: boolean;
  node: ProjectFolderNode | null;
  name: string;
  depth: number;
  listeners: any | null;
  outline: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  const {
    selectedFolder,
    currentOpenFolders,
    setFolderPXFromTop,
    draggingFolderDepth,
  } = useFoldersCurrentDataStore();

  const alteredDepth = isGhost
    ? Math.max((draggingFolderDepth ?? 0) - 1, 0)
    : Math.max((depth ?? 0) - 1, 0);

  const isRoot = !isGhost && depth === 0;
  const nodeId = node ? node.id : null;
  const nodeFolderId = node ? node.folder_id : null
  const isOpen = nodeFolderId && currentOpenFolders.has(nodeFolderId);

  return (
    <div
      className="flex h-[34px] items-center gap-2 px-2 rounded-[5px] hover:brightness-90 dim"
      style={{
        width: `calc(100% - ${alteredDepth} * 10px)`,
        marginLeft: `calc(${alteredDepth} * 10px)`,
        outline: outline ? `1px solid ${currentTheme.text_4}` : undefined,
        display: isRoot ? "none" : "flex",
        marginTop: isRoot ? -30 : 0,
        marginBottom: isRoot ? 30 : 0,
        cursor: isGhost ? "grab" : "pointer",
        backgroundColor:
          nodeId && selectedFolder && selectedFolder.id === nodeId
            ? currentTheme.background_2_2
            : currentTheme.background_2_dim,
      }}
    >
      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      <div
        className="cursor-grab"
        onPointerDownCapture={(e) => {
          const el = e.currentTarget.closest(
            "[data-draggable]",
          ) as HTMLElement | null;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          setFolderPXFromTop(e.clientY - rect.top - 18);
        }}
      >
        {listeners !== null ? (
          <GripVertical {...listeners} size={14} />
        ) : (
          <GripVertical size={14} />
        )}
      </div>

      <Folder size={16} className="mt-[1px]" />
      <span className="truncate select-none">{name}</span>
    </div>
  );
};
