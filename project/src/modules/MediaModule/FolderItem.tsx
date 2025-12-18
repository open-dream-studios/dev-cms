// project/src/modules/MediaModule/FolderItem.tsx
"use client";

import { CSS } from "@dnd-kit/utilities";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { MediaFolder } from "@open-dream/shared";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { motion } from "framer-motion";
import { AuthContext } from "@/contexts/authContext";
import {
  setCurrentActiveFolder,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useUiStore } from "@/store/useUIStore";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useQueryClient } from "@tanstack/react-query";
import { createFolderContextMenu } from "./_actions/media.actions";
import { useMediaModuleUIStore } from "./_store/media.store";

type FolderItemProps = {
  folder: MediaFolder & { children?: MediaFolder[] };
  depth: number;
  toggleFolderOpen: (id: number) => void;
};

export default function FolderItem({
  folder,
  depth,
  toggleFolderOpen,
}: FolderItemProps) {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { upsertMediaFolders } = useContextQueries();
  const { currentProjectId, currentActiveFolder, currentOpenFolders } =
    useCurrentDataStore();
  const { hoveredFolder } = useUiStore();
  const [tempName, setTempName] = useState<string>(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openContextMenu } = useContextMenuStore();
  const { renamingFolder, setRenamingFolder } = useMediaModuleUIStore();

  useEffect(() => {
    if (renamingFolder === folder.folder_id) {
      setTempName(folder.name);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // inputRef.current.select();
        }
      }, 0);
    }
  }, [renamingFolder, folder.id, folder.name]);

  const handleRename = async () => {
    if (!currentProjectId) return;
    if (tempName.trim() && tempName !== folder.name && folder.id) {
      await upsertMediaFolders([
        {
          folder_id: folder.folder_id,
          project_idx: currentProjectId,
          parent_folder_id: folder.parent_folder_id,
          name: tempName.trim(),
          ordinal: folder.ordinal,
        } as MediaFolder,
      ]);
    }
    setRenamingFolder(null);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id!,
  });

  const isOpen = currentOpenFolders.has(folder.id!);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 16}px`,
  };

  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      setCurrentActiveFolder(folder);
      if (folder.children && folder.children.length > 0 && folder.id) {
        toggleFolderOpen(folder.id);
      }
    }, 200);
  };

  const handleDoubleClick = () => {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    if (folder.folder_id) {
      setRenamingFolder(folder.folder_id);
    }
  };
  const isDraggedOver = hoveredFolder === String(folder.id);

  const [hovered, setHovered] = useState(false);

  if (!currentUser) return null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0 : 1,
      }}
      data-folder-id={folder.id}
      {...attributes}
    >
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer rounded`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu({
            position: { x: e.clientX, y: e.clientY },
            target: folder,
            menu: createFolderContextMenu(queryClient),
          });
        }}
        animate={{
          backgroundColor:
            hovered || isDraggedOver
              ? currentTheme.background_2
              : currentActiveFolder && currentActiveFolder.id === folder.id
              ? currentTheme.background_2
              : currentTheme.background_1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <span className="cursor-grab active:cursor-grabbing" {...listeners}>
          <GripVertical size={14} className="text-gray-400" />
        </span>

        {folder.children?.length ? (
          isOpen ? (
            <ChevronDown size={15} className="w-[20px]" />
          ) : (
            <ChevronRight size={15} className="w-[20px]" />
          )
        ) : (
          <span className="w-[20px]" />
        )}

        {isOpen ? (
          <FolderOpen size={16} className="w-[24px]" />
        ) : (
          <Folder size={16} className="w-[24px]" />
        )}

        {renamingFolder === folder.folder_id ? (
          <input
            ref={inputRef}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="w-[100%] outline-none text-[16px]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="w-[100%]">{folder.name}</span>
        )}
      </motion.div>

      {isOpen && folder.children && folder.children.length > 0 && (
        <div className="ml-2">
          <SortableContext
            items={folder.children.map((c) => c.id!)}
            strategy={verticalListSortingStrategy}
          >
            {folder.children.map((child) => (
              <FolderItem
                key={child.id}
                folder={child}
                depth={depth + 1}
                toggleFolderOpen={toggleFolderOpen}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
