// project/src/components/media/MediaFoldersSidebar.tsx
"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext";
import { buildFolderTree, MediaFolderNode } from "@/util/functions/Tree";
import FolderItem from "./FolderItem";
import { MediaFolder } from "@/types/media";
import { useModal2Store } from "@/store/useModalStore";
import Modal2Input from "@/modals/Modal2Input";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";

type MediaFoldersSidebarProps = {
  activeFolder: number | null;
  setActiveFolder: (id: number | null) => void;
};

export default function MediaFoldersSidebar({
  activeFolder,
  setActiveFolder,
}: MediaFoldersSidebarProps) {
  const { currentProjectId } = useProjectContext();
  const { mediaFolders, addMediaFolder, reorderMediaFolders } =
    useContextQueries();

  const sensors = useSensors(useSensor(PointerSensor));
  const folderTree: MediaFolderNode[] = buildFolderTree(mediaFolders ?? []);

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  // Helper: find parentId of a folder by id
  const findParentId = (
    id: number,
    nodes: MediaFolderNode[],
    parentId: number | null = null
  ): number | null => {
    for (const n of nodes) {
      if (n.id === id) return parentId;
      if (n.children && n.children.length) {
        const childResult = findParentId(id, n.children, n.id);
        if (childResult !== null) return childResult;
      }
    }
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const parentId = findParentId(active.id as number, folderTree);
    const siblings: MediaFolder[] = parentId
      ? (mediaFolders ?? []).filter((f) => f.parent_id === parentId)
      : (mediaFolders ?? []).filter((f) => f.parent_id === null);

    const oldIndex = siblings.findIndex((f) => f.id === active.id);
    const newIndex = siblings.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

    reorderMediaFolders({
      parent_id: parentId,
      orderedIds: newSiblingsOrder.map((f) => f.id),
    });
  };

  const handleAddFolder = async () => {
    if (!currentProjectId) return;
    console.log(activeFolder)
    const steps: StepConfig[] = [
      {
        name: "name",
        placeholder: "Folder Name...",
        validate: (val) => (val.length > 1 ? true : "2+ characters required"),
      },
    ];

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          steps={steps}
          onComplete={async (values) => {
            await addMediaFolder({
              project_idx: currentProjectId,
              parent_id: activeFolder,
              name: values.name,
            });
          }}
        />
      ),
    });
  };

  return (
    <div className="w-60 border-r h-[100%] flex flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={folderTree.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {folderTree.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                depth={0}
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <button
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border-t"
        onClick={handleAddFolder}
      >
        <Plus size={16} /> Add Folder
      </button>
    </div>
  );
}
