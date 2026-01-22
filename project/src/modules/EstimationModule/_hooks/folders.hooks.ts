"use client";

import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { queryClient } from "@/lib/queryClient";
import { EstimationFactFolder } from "@open-dream/shared";
import { useEstimationFactsUIStore } from "../_store/estimations.store";

type Args = {
  factFolders: EstimationFactFolder[];
  currentProjectId: number | null;
  reorderFactFolders: (args: {
    process_id: number;
    parent_folder_id: number | null;
    orderedIds: string[];
  }) => Promise<any>;
};

export function useFolderDndHandlers({
  factFolders,
  currentProjectId,
  reorderFactFolders,
}: Args) {
  const { setDraggingFolderId } = useEstimationFactsUIStore()

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (!id.startsWith("folder-")) return;

    setDraggingFolderId(id.replace("folder-", ""));
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setDraggingFolderId(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id).replace("folder-", "");
    const overId = String(over.id).replace("folder-", "");

    const draggedFolder = factFolders.find(
      (f) => f.folder_id === activeId,
    );
    if (!draggedFolder) return;

    const parentFolderId = draggedFolder.parent_folder_id ?? null;

    const siblings = factFolders
      .filter((f) => f.parent_folder_id === parentFolderId)
      .sort((a, b) => a.ordinal - b.ordinal);

    const oldIndex = siblings.findIndex(
      (f) => f.folder_id === activeId,
    );
    const newIndex = siblings.findIndex(
      (f) => f.folder_id === overId,
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);

    // 🔥 optimistic cache update
    queryClient.setQueryData(
      ["estimationFactFolders", currentProjectId],
      (prev: EstimationFactFolder[] | undefined) => {
        if (!prev) return prev;
        return prev.map((f) => {
          const idx = reordered.findIndex((r) => r.id === f.id);
          return idx === -1 ? f : { ...f, ordinal: idx };
        });
      },
    );

    // 🔥 backend reorder
    await reorderFactFolders({
      process_id: 1,
      parent_folder_id: parentFolderId,
      orderedIds: reordered.map((f) => f.folder_id),
    });
  };

  const onDragCancel = () => {
    setDraggingFolderId(null);
  };

  return {
    onDragStart,
    onDragEnd,
    onDragCancel,
  };
}