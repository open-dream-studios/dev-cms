// project/src/modules/_util/Folders/DraggableFolderItemDisplay.tsx
"use client";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { ChevronRight, ChevronDown, Folder, GripVertical } from "lucide-react";
import {
  ProjectFolderNode,
  useFoldersCurrentDataStore,
} from "./_store/folders.store";
import { FolderScope } from "@open-dream/shared";

export const FolderItemDisplay = ({
  scope,
  isGhost,
  node,
  name,
  depth,
  listeners,
  outline,
}: {
  scope: FolderScope;
  isGhost: boolean;
  node: ProjectFolderNode | null;
  name: string;
  depth: number;
  listeners: any | null;
  outline: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  const {
    selectedFoldersByScope,
    currentOpenFolders,
    setFolderPXFromTop,
    draggingFolderDepth,
  } = useFoldersCurrentDataStore();

  const folderIndent = isGhost ? (draggingFolderDepth ?? 0) : (depth ?? 0);
  const nodeId = node ? node.id : null;
  const nodeFolderId = node ? node.folder_id : null;
  const isOpen = nodeFolderId && currentOpenFolders.has(nodeFolderId);
  const selected = node ? selectedFoldersByScope[scope] : null;

  return (
    <div
      className="flex h-[34px] items-center gap-2 px-2 rounded-[5px] hover:brightness-90 dim"
      style={{
        width: `calc(100% - ${folderIndent} * 10px)`,
        marginLeft: `calc(${folderIndent} * 10px)`,
        outline: outline ? `1px solid ${currentTheme.text_4}` : undefined,
        cursor: isGhost ? "grab" : "pointer",
        backgroundColor:
          nodeId && selected && selected.id === nodeId
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
      <span className="truncate select-none">{name} - {node?.ordinal ?? ""}</span>
    </div>
  );
};
