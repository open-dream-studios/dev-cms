// project/src/modules/_util/Folders/FolderItem.tsx
"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { EstimationFactDefinition, FolderScope } from "@open-dream/shared";
import { useDndContext } from "@dnd-kit/core";
import {
  createFolderContextMenu,
  toggleFolder,
} from "@/modules/_util/Folders/_actions/folders.actions";
import { FolderItemDisplay } from "./FolderItemDisplay";
import { useProjectFolderHooks } from "@/modules/_util/Folders/_hooks/folders.hooks";
import {
  FlatFolderNode,
  useFoldersCurrentDataStore,
} from "./_store/folders.store";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import ProcessDraggableItem from "@/modules/EstimationModule/components/ProcessDraggableItem";
import VariableDraggableItem from "@/modules/EstimationModule/components/VariableDraggableItem";

const DraggableFolderItem = ({
  flat,
  scope,
}: {
  flat: FlatFolderNode;
  scope: FolderScope;
}) => {
  const { openContextMenu } = useContextMenuStore();
  const { setSelectedFolder } = useFoldersCurrentDataStore();
  const { handleEditFolder } = useProjectFolderHooks(scope);
  const { folderPXFromTop, setEdgeHoverFolderId } =
    useFoldersCurrentDataStore();
  const { active } = useDndContext();
  const [isEdgeHover, setIsEdgeHover] = useState(false);

  useEffect(() => {
    if (!active || active.data.current?.kind !== "FOLDER") return;
    const activeFolderId = active.data.current.folder.folder_id;
    if (activeFolderId === node.folder_id) return;
    setEdgeHoverFolderId(isEdgeHover ? node.folder_id : null);
  }, [isEdgeHover, active]);

  const refRect = useRef<DOMRect | null>(null);

  const { node, depth } = flat;

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `folder-${node.folder_id}`,
    data: { kind: "FOLDER", folder: node, depth: flat.depth },
  });
  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    if (el) refRect.current = el.getBoundingClientRect();
  };

  const isDraggingOverFolder =
    active?.data.current?.kind.startsWith("FOLDER-ITEM") ||
    active?.data.current?.kind === "FOLDER";

  useEffect(() => {
    if (!active || active.data.current?.kind !== "FOLDER") {
      setIsEdgeHover(false);
      return;
    }

    const handleMove = (e: PointerEvent) => {
      if (!refRect.current) return;
      const { top, bottom } = refRect.current;
      const EDGE = 17;
      const adjustedY = e.clientY - folderPXFromTop;
      const nearTop = Math.abs(adjustedY - top) <= EDGE;
      const nearBottom = Math.abs(adjustedY - bottom) <= EDGE;

      setIsEdgeHover(nearTop || nearBottom);
    };

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [active, folderPXFromTop]);

  return (
    <div
      data-draggable
      data-folder-item
      ref={setRefs}
      className="mb-[4px] w-[100%]"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        pointerEvents: isDragging ? "none" : "auto",
      }}
    >
      {/* Folder Row */}
      <div
        {...attributes}
        className="w-[100%] h-auto rounded-[5px]"
        onClick={() => {
          setSelectedFolder({
            scope,
            folder_id: node.folder_id,
            id: node.id,
          });
          toggleFolder(node);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu({
            position: { x: e.clientX, y: e.clientY },
            target: node,
            menu: createFolderContextMenu(() => handleEditFolder(node)),
          });
        }}
      >
        <FolderItemDisplay
          isGhost={false}
          nodeId={node.id}
          name={node.name}
          depth={depth}
          listeners={listeners}
          isOpen={false}
          outline={isEdgeHover && isDraggingOverFolder && depth !== 0}
        />
      </div>

      {/* Items UNDER folder */}
      {node.items.map((item, index) => (
        <div
          key={item.id}
          style={{
            marginLeft: `${(depth + 1) * 10}px`,
          }}
        >
          {scope === "estimation_fact_definition" && (
            <VariableDraggableItem fact={item as EstimationFactDefinition} />
          )}
          {scope === "estimation_process" && (
            <ProcessDraggableItem
              estimationProcess={item as EstimationProcess}
              index={index}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default DraggableFolderItem;
