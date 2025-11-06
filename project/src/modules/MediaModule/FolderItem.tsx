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
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useDnDStore } from "@/store/useDnDStore";
import { useCurrentTheme } from "@/hooks/useTheme";

type FolderItemProps = {
  folder: MediaFolder & { children?: MediaFolder[] };
  depth: number;
  activeFolder: MediaFolder | null;
  setActiveFolder: (mediaFolder: MediaFolder | null) => void;
  openFolders: Set<number>;
  toggleFolderOpen: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, folderId: string) => void;
  renamingFolder: string | null;
  setRenamingFolder: (folder_id: string | null) => void;
};

export default function FolderItem({
  folder,
  depth,
  activeFolder,
  setActiveFolder,
  openFolders,
  toggleFolderOpen,
  onContextMenu,
  renamingFolder,
  setRenamingFolder,
}: FolderItemProps) {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme()
  const { upsertMediaFolders } = useContextQueries();
  const { currentProjectId } = useCurrentDataStore();
  const [tempName, setTempName] = useState<string>(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const isOpen = openFolders.has(folder.id!);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 16}px`,
  };

  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      setActiveFolder(folder);
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
  const hoveredFolder = useDnDStore((state) => state.hoveredFolder);
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
          if (folder.folder_id) {
            onContextMenu(e, folder.folder_id);
          }
        }}
        animate={{
          backgroundColor:
            hovered || isDraggedOver
              ? currentTheme.background_2
              : activeFolder && activeFolder.id === folder.id
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
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
                openFolders={openFolders}
                toggleFolderOpen={toggleFolderOpen}
                onContextMenu={onContextMenu}
                renamingFolder={renamingFolder}
                setRenamingFolder={setRenamingFolder}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
