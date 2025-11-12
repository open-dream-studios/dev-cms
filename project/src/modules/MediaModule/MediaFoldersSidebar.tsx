// project/src/modules/MediaModule/MediaFoldersSidebar.tsx
"use client";

import { useContext, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Folder,
  FolderOpen,
  GripVertical,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { buildFolderTree, MediaFolderNode } from "@/util/functions/Tree";
import FolderItem from "./FolderItem";
import { MediaFolder } from "@open-dream/shared";
import { useModal2Store } from "@/store/useModalStore";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/contexts/authContext";
import { FaPlus } from "react-icons/fa6";
import Divider from "@/lib/blocks/Divider";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { motion } from "framer-motion";
import { useDnDStore } from "@/store/useDnDStore";
import { useCurrentTheme } from "@/hooks/useTheme";

function findNode(
  nodes: MediaFolderNode[],
  id: number
): MediaFolderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function MediaFoldersSidebar() {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme(); 
  const { mediaFolders, upsertMediaFolders, deleteMediaFolder } =
    useContextQueries();
  const {
    currentProjectId,
    currentActiveFolder,
    setCurrentActiveFolder,
    currentOpenFolders,
    setCurrentOpenFolders,
  } = useCurrentDataStore();

  const sensors = useSensors(useSensor(PointerSensor));
  const [localFolders, setLocalFolders] = useState<MediaFolder[]>([]);
  useEffect(() => {
    if (mediaFolders) {
      setLocalFolders(
        [...mediaFolders].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
      );
    }
  }, [mediaFolders]);

  const folderTree: MediaFolderNode[] = buildFolderTree(localFolders);

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    folderId: string | null;
  } | null>(null);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      folderId,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleDeleteFolder = async () => {
    if (contextMenu?.folderId) {
      await deleteMediaFolder(contextMenu.folderId);
      setContextMenu(null);
      if (currentActiveFolder && currentActiveFolder.folder_id === contextMenu.folderId) {
        setCurrentActiveFolder(null);
      }
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    }
  };

  const toggleFolderOpen = (id: number) => {
    setCurrentOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  const originalFoldersRef = useRef<MediaFolder[]>([]);
  useEffect(() => {
    if (mediaFolders) {
      originalFoldersRef.current = mediaFolders;
      setLocalFolders(
        [...mediaFolders].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
      );
    }
  }, [mediaFolders]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const parentId = findParentId(active.id as number, folderTree);
    const siblings: MediaFolder[] = parentId
      ? localFolders.filter((f) => f.parent_folder_id === parentId)
      : localFolders.filter((f) => f.parent_folder_id === null);

    const oldIndex = siblings.findIndex((f) => f.id === active.id);
    const newIndex = siblings.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

    setLocalFolders((prev) =>
      prev.map((folder) => {
        const idx = newSiblingsOrder.findIndex((f) => f.id === folder.id);
        return idx > -1 ? { ...folder, ordinal: idx } : folder;
      })
    );

    const updatedFolders = newSiblingsOrder
      .map((f, idx) => ({ ...f, ordinal: idx }))
      .filter((f) => {
        const original = originalFoldersRef.current.find(
          (of) => of.id === f.id
        );
        return original && original.ordinal !== f.ordinal;
      });

    if (updatedFolders.length > 0) {
      await upsertMediaFolders(updatedFolders);
    }
  };

  const newlyAddedFolderRef = useRef<number | null>(null);
  useEffect(() => {
    if (newlyAddedFolderRef.current) {
      const folderFound = mediaFolders.find(
        (mediaFolder: MediaFolder) =>
          mediaFolder.folder_id === newlyAddedFolderRef.current
      );
      if (folderFound) {
        setCurrentActiveFolder(folderFound);
      }
      newlyAddedFolderRef.current = null;
    }
  }, [mediaFolders]);

  const handleAddFolder = async () => {
    if (!currentProjectId) return;
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
            const newIds = await upsertMediaFolders([
              {
                folder_id: null,
                project_idx: currentProjectId,
                parent_folder_id: currentActiveFolder ? currentActiveFolder.id : null,
                name: values.name,
                ordinal: null,
              } as MediaFolder,
            ]);
            if (newIds && newIds.length) {
              if (currentActiveFolder && currentActiveFolder.id) {
                setCurrentOpenFolders((prev) => new Set(prev).add(currentActiveFolder.id!));
              }
              newlyAddedFolderRef.current = newIds[0];
            }
          }}
        />
      ),
    });
  };

  const renderFolderIcons = (folder: MediaFolderNode) => {
    if (!folder.id) return;
    const isOpen = currentOpenFolders.has(folder.id);

    return (
      <>
        {folder.children?.length ? (
          isOpen ? (
            <ChevronDown size={15} className="w-[13px]" />
          ) : (
            <ChevronRight size={15} className="w-[13px]" />
          )
        ) : (
          <span className="w-[13px]" />
        )}

        {isOpen ? (
          <FolderOpen size={16} className="w-[17px]" />
        ) : (
          <Folder size={16} className="w-[17px]" />
        )}
      </>
    );
  };

  const [activeId, setActiveId] = useState<number | null>(null);

  const hoveredFolder = useDnDStore((state) => state.hoveredFolder);
  const isDraggedOver = hoveredFolder === "-1";

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const folders =
        document.querySelectorAll<HTMLElement>("[data-folder-id]");
      let hovered: string | null = null;

      folders.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          hovered = el.dataset.folderId ?? null;
        }
      });

      const topBar = document.querySelector<HTMLElement>("[data-folders-top]");
      if (topBar) {
        const rect = topBar.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          hovered = "-1";
        }
      }

      useDnDStore.getState().setHoveredFolder(hovered);
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  if (!currentUser) return null;

  return (
    <div
      className="w-60 h-[100%] flex flex-col"
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border shadow-lg rounded-md py-1 w-40 animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={handleCloseContextMenu}
        >
          <button
            onClick={handleDeleteFolder}
            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600"
          >
            Delete Folder
          </button>
          <button
            onClick={() => {
              setRenamingFolder(contextMenu.folderId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
          >
            Rename Folder
          </button>
        </div>
      )}

      <motion.div
        data-folders-top={-1}
        className={
          "px-[15px] flex flex-row items-center justify-between pt-[12px] pb-[6px] h-[61px]"
        }
        animate={{
          backgroundColor: isDraggedOver
            ? currentTheme.background_2
            : currentTheme.background_1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
          <p
            onClick={() => setCurrentActiveFolder(null)}
            className="cursor-pointer hover:opacity-[75%] transition-all duration-300 ease-in-out w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]"
          >
            Media
          </p>
        </div>

        <div
          onClick={handleAddFolder}
          className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
          style={{
            backgroundColor: currentTheme.background_1_2,
          }}
        >
          <FaPlus size={12} />
        </div>
      </motion.div>

      <div className="w-[100%] px-[15px] mt-[-1px]">
        <Divider mb={10} />
      </div>

      <div className="px-[15px] flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={(event) => {
            setActiveId(event.active.id as number);
          }}
          onDragEnd={(event) => {
            setActiveId(null);
            handleDragEnd(event);
          }}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={folderTree.map((f) => f.id!)}
            strategy={verticalListSortingStrategy}
          >
            {folderTree.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                depth={0}
                toggleFolderOpen={toggleFolderOpen}
                onContextMenu={handleContextMenu}
                renamingFolder={renamingFolder}
                setRenamingFolder={setRenamingFolder}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeId
              ? (() => {
                  const activeNode = findNode(folderTree, activeId);
                  if (!activeNode) return null;

                  return (
                    <div
                      style={{
                        backgroundColor: currentTheme.background_2,
                      }}
                      className="flex items-center gap-2 px-2 py-1 shadow rounded max-h-[32px]"
                    >
                      <GripVertical size={14} className="text-gray-400" />
                      {renderFolderIcons(activeNode)}
                      <span className="truncate">{activeNode.name}</span>
                    </div>
                  );
                })()
              : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
