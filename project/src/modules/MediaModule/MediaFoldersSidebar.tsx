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
import { MediaFolder } from "@/types/media";
import { useModal2Store } from "@/store/useModalStore";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useQueryClient } from "@tanstack/react-query";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { FaPlus } from "react-icons/fa6";
import Divider from "@/lib/blocks/Divider";
import { useCurrentDataStore } from "@/store/currentDataStore";

type MediaFoldersSidebarProps = {
  activeFolder: MediaFolder | null;
  setActiveFolder: (mediaFolder: MediaFolder | null) => void;
  openFolders: Set<number>;
  setOpenFolders: React.Dispatch<React.SetStateAction<Set<number>>>;
};

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

export default function MediaFoldersSidebar({
  activeFolder,
  setActiveFolder,
  openFolders,
  setOpenFolders,
}: MediaFoldersSidebarProps) {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { mediaFolders, upsertMediaFolders, deleteMediaFolder } =
    useContextQueries();

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

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

  const [renamingFolder, setRenamingFolder] = useState<number | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    folderId: number | null;
  } | null>(null);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, folderId: number) => {
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
      if (activeFolder && activeFolder.id === contextMenu.folderId) {
        setActiveFolder(null);
      }
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
      queryClient.invalidateQueries({
        queryKey: ["mediaFolders", currentProjectId],
      });
    }
  };

  const toggleFolderOpen = (id: number) => {
    setOpenFolders((prev) => {
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

    // Find the parent group for this move
    const parentId = findParentId(active.id as number, folderTree);

    // Identify the siblings in that parent scope
    const siblings: MediaFolder[] = parentId
      ? localFolders.filter((f) => f.parent_folder_id === parentId)
      : localFolders.filter((f) => f.parent_folder_id === null);

    const oldIndex = siblings.findIndex((f) => f.id === active.id);
    const newIndex = siblings.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Compute the new sibling order
    const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

    // Update local state optimistically
    setLocalFolders((prev) =>
      prev.map((folder) => {
        const idx = newSiblingsOrder.findIndex((f) => f.id === folder.id);
        return idx > -1 ? { ...folder, ordinal: idx } : folder;
      })
    );

    // Prepare array of folders for upsert (only those whose ordinal changed)
    const updatedFolders = newSiblingsOrder
      .map((f, idx) => ({ ...f, ordinal: idx })) // set new ordinal
      .filter((f) => {
        const original = originalFoldersRef.current.find(
          (of) => of.id === f.id
        );
        return original && original.ordinal !== f.ordinal;
      });

    if (updatedFolders.length > 0) {
      // Call unified upsert endpoint with only changed folders
      await upsertMediaFolders(updatedFolders);
    }
  };

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
                parent_folder_id: activeFolder ? activeFolder.id : null,
                name: values.name,
                ordinal: null,
              } as MediaFolder,
            ]);
            if (newIds && newIds.length) {
              const newId = newIds[0];
              if (activeFolder && activeFolder.id) {
                setOpenFolders((prev) => new Set(prev).add(activeFolder.id!));
              }
              const folderFound = mediaFolders.find(
                (mediaFolder: MediaFolder) => mediaFolder.id === newId
              );
              if (folderFound) {
                setActiveFolder(folderFound);
              }
            }
          }}
        />
      ),
    });
  };

  const renderFolderIcons = (folder: MediaFolderNode) => {
    if (!folder.id) return;
    const isOpen = openFolders.has(folder.id);

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

  if (!currentUser) return null;

  return (
    <div
      className="w-60 h-[100%] flex flex-col px-[15px]"
      style={{
        borderRight: `0.5px solid ${t.background_2}`,
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

      <div className="flex flex-row items-center justify-between pt-[12px] pb-[6px]">
        <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
          <p
            onClick={() => setActiveFolder(null)}
            className="cursor-pointer hover:opacity-[75%] transition-all duration-300 ease-in-out w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]"
          >
            Media
          </p>
        </div>

        <div
          onClick={handleAddFolder}
          className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
          style={{
            backgroundColor: t.background_1_2,
          }}
        >
          <FaPlus size={12} />
        </div>
      </div>

      <Divider />

      <div className="flex-1 overflow-y-auto">
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
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
                openFolders={openFolders}
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
                        backgroundColor: t.background_2,
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
