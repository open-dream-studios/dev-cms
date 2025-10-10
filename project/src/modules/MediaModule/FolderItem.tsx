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
import { MouseEventHandler, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { MediaFolder } from "@/types/media";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { motion } from "framer-motion"
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";

type FolderItemProps = {
  folder: MediaFolder & { children?: MediaFolder[] };
  depth: number;
  activeFolder: MediaFolder | null;
  setActiveFolder: (mediaFolder: MediaFolder | null) => void;
  openFolders: Set<number>;
  toggleFolderOpen: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, folderId: number) => void;
  renamingFolder: number | null;
  setRenamingFolder: (id: number | null) => void;
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
  const { renameMediaFolder } = useContextQueries();
  const [tempName, setTempName] = useState<string>(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingFolder === folder.id) {
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
    if (tempName.trim() && tempName !== folder.name) {
      await renameMediaFolder({ folder_id: folder.id, name: tempName.trim() });
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
    id: folder.id,
  });

  const isOpen = openFolders.has(folder.id);

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
      if (folder.children && folder.children.length > 0) {
        toggleFolderOpen(folder.id);
      }
    }, 200);
  };

  const handleDoubleClick = () => {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    setRenamingFolder(folder.id);
  };

  const [hovered, setHovered] = useState(false);

    if (!currentUser) return null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0 : 1,
      }}
      {...attributes}
    >
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer rounded`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => onContextMenu(e, folder.id)}
         animate={{
        backgroundColor: hovered
          ? appTheme[currentUser.theme].background_2
          : activeFolder && activeFolder.id === folder.id
            ? appTheme[currentUser.theme].background_2
            : appTheme[currentUser.theme].background_1,
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

        {renamingFolder === folder.id ? (
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
            items={folder.children.map((c) => c.id)}
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
