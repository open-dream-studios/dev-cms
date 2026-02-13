// project/src/modules/_util/Folders/FolderItem.tsx
"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { FolderScope } from "@open-dream/shared";
import { useDndContext } from "@dnd-kit/core";
import {
  createFolderContextMenu,
  toggleFolder,
} from "@/modules/_util/Folders/_actions/folders.actions";
import { FolderItemDisplay } from "./FolderItemDisplay";
import { useProjectFolderHooks } from "@/modules/_util/Folders/_hooks/folders.hooks";
import {
  edgeHoverFolderRef,
  FlatNode,
  setSelectedFolderForScope,
  useFoldersCurrentDataStore,
} from "./_store/folders.store";

const DraggableFolderItem = ({
  flat,
  scope,
}: {
  flat: Extract<FlatNode, { type: "folder" }>;
  scope: FolderScope;
}) => {
  const { openContextMenu } = useContextMenuStore();
  const { handleEditFolder } = useProjectFolderHooks(scope);
  const { folderPXFromTop, edgeHoverFolderId, setEdgeHoverFolderId } =
    useFoldersCurrentDataStore();
  const { active } = useDndContext();
  const [isEdgeHover, setIsEdgeHover] = useState(false);

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

  // // White Edge
  // useEffect(() => {
  //   if (!active || active.data.current?.kind !== "FOLDER") return;
  //   const activeFolderId = active.data.current.folder.folder_id;
  //   if (activeFolderId === node.folder_id) return;
  //   setEdgeHoverFolderId(isEdgeHover ? node.folder_id : null);
  // }, [isEdgeHover, active]);

  // FOLDERS
  // useEffect(() => {
  //   if (!active || active.data.current?.kind !== "FOLDER") {
  //     // setIsEdgeHover(false);
  //     return;
  //   }
  //   const handleMove = (e: PointerEvent) => {
  //     if (!refRect.current) return;
  //     const { top, bottom } = refRect.current;
  //     const EDGE = 17;
  //     const adjustedY = e.clientY - folderPXFromTop;
  //     const nearTop = Math.abs(adjustedY - top) <= EDGE;
  //     const nearBottom = Math.abs(adjustedY - bottom) <= EDGE;
  //     setIsEdgeHover(nearTop || nearBottom);
  //   };

  //   window.addEventListener("pointermove", handleMove);
  //   return () => window.removeEventListener("pointermove", handleMove);
  // }, [active, folderPXFromTop]);

  useEffect(() => {
    if (!active || active.data.current?.kind !== "FOLDER") return;

    const activeFolderId = active.data.current.folder.folder_id;

    const handleMove = (e: PointerEvent) => {
      if (!refRect.current) return;
      if (activeFolderId === node.folder_id) return;

      const { top, bottom } = refRect.current;
      const EDGE = 17;
      const adjustedY = e.clientY - folderPXFromTop;

      const nearTop = Math.abs(adjustedY - top) <= EDGE;
      const nearBottom = Math.abs(adjustedY - bottom) <= EDGE;

      const isEdge = nearTop || nearBottom;

      setIsEdgeHover(isEdge);

      // IMPORTANT: set global drop intent HERE
      if (isEdge) {
        edgeHoverFolderRef.current = node.folder_id;
        setEdgeHoverFolderId(node.folder_id);
      } else {
        // Always clear if not edge
        if (edgeHoverFolderRef.current === node.folder_id) {
          edgeHoverFolderRef.current = null;
          setEdgeHoverFolderId(null);
        }
      }
    };

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [active, folderPXFromTop, node.folder_id, edgeHoverFolderId]);

  // ITEMS
  useEffect(() => {
    if (!active) {
      // setEdgeHoverFolderId(null);
      return;
    }

    const kind = active.data.current?.kind;
    const isItem =
      kind === "FOLDER-ITEM-FACT" || kind === "FOLDER-ITEM-PROCESS";

    if (!isItem) {
      setEdgeHoverFolderId(null);
      return;
    }

    const handleMove = (e: PointerEvent) => {
      if (!refRect.current) return;
      const { top, bottom } = refRect.current;
      const pointerY = e.clientY;
      if (pointerY >= top && pointerY <= bottom) {
        setEdgeHoverFolderId(node.folder_id);
      } else if (edgeHoverFolderId === node.folder_id) {
        // clear highlight when leaving folder
        setEdgeHoverFolderId(null);
      }
    };

    window.addEventListener("pointermove", handleMove);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (edgeHoverFolderId === node.folder_id) {
        setEdgeHoverFolderId(null);
      }
    };
  }, [active, node.folder_id, edgeHoverFolderId]);

  return (
    <div
      data-draggable
      data-folder-item
      data-folder-id={node.id}
      ref={setRefs}
      className={`mb-[4px] w-[100%]`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        pointerEvents: isDragging ? "none" : "auto",
      }}
    >
      <div
        {...attributes}
        className="w-[100%] h-auto rounded-[5px] "
        onClick={() => {
          setSelectedFolderForScope(scope, {
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
          scope={scope}
          isGhost={false}
          node={node}
          name={node.name}
          depth={depth}
          listeners={listeners}
          outline={
            (active?.data.current?.kind === "FOLDER" && isEdgeHover) ||
            (active?.data.current?.kind?.startsWith("FOLDER-ITEM") &&
              edgeHoverFolderId === node.folder_id)
          }
        />
      </div>
    </div>
  );
};

export default DraggableFolderItem;
