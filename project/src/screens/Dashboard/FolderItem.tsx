// project/src/components/media/FolderItem.tsx
"use client";

import { CSS } from "@dnd-kit/utilities";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Folder, FolderOpen, ChevronRight, ChevronDown, GripVertical } from "lucide-react";
import { useState } from "react";
import { MediaFolder } from "@/types/media";

type FolderItemProps = {
  folder: MediaFolder & { children?: MediaFolder[] };
  depth: number;
  activeFolder: number | null;
  setActiveFolder: (id: number) => void;
};

export default function FolderItem({
  folder,
  depth,
  activeFolder,
  setActiveFolder,
}: FolderItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: folder.id,
  });

  const [isOpen, setIsOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 16}px`,
  };

  const handleClick = () => {
    setActiveFolder(folder.id);
    if (folder.children && folder.children.length > 0) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer rounded ${
          activeFolder === folder.id
            ? "bg-gray-200 font-semibold"
            : "hover:bg-gray-100"
        }`}
        onClick={handleClick}
      >
        {/* Drag handle (only this element listens for drag) */}
        <span
          className="cursor-grab active:cursor-grabbing"
          {...listeners}
        >
          <GripVertical size={14} className="text-gray-400" />
        </span>

        {/* Expand/collapse icon */}
        {folder.children && folder.children.length > 0 ? (
          isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : (
          <span className="w-[14px]" /> // spacer
        )}

        {/* Folder icon */}
        {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}

        <span>{folder.name}</span>
      </div>

      {/* Render children only when open */}
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
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}