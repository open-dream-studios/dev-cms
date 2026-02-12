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
import { arrayMove } from "@dnd-kit/sortable";
import {
  Folder,
  FolderOpen,
  GripVertical,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { buildFolderTree, MediaFolderNode } from "@/util/functions/Tree";
import { FolderScope, MediaFolder } from "@open-dream/shared";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { AuthContext } from "@/contexts/authContext";
import { FaPlus } from "react-icons/fa6";
import Divider from "@/lib/blocks/Divider";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { motion } from "framer-motion";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useUiStore } from "@/store/useUIStore";
import {
  setCurrentOpenFolders,
  setSelectedFolderForScope,
  useFoldersCurrentDataStore,
} from "../_util/Folders/_store/folders.store";

function findNode(
  nodes: MediaFolderNode[],
  id: number,
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
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { mediaFolders, upsertMediaFolders } = useContextQueries();
  const { hoveredFolder, setHoveredFolder, modal2, setModal2 } = useUiStore();
  const { currentProjectId } = useCurrentDataStore();
  const { currentOpenFolders } = useFoldersCurrentDataStore();

  const sensors = useSensors(useSensor(PointerSensor));
  const [localFolders, setLocalFolders] = useState<MediaFolder[]>([]);
  useEffect(() => {
    if (mediaFolders) {
      setLocalFolders(
        [...mediaFolders].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)),
      );
    }
  }, [mediaFolders]);

  const folderTree: MediaFolderNode[] = buildFolderTree(localFolders);

  const findParentId = (
    id: number,
    nodes: MediaFolderNode[],
    parentId: number | null = null,
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
        [...mediaFolders].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)),
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
      }),
    );

    const updatedFolders = newSiblingsOrder
      .map((f, idx) => ({ ...f, ordinal: idx }))
      .filter((f) => {
        const original = originalFoldersRef.current.find(
          (of) => of.id === f.id,
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
          mediaFolder.folder_id === newlyAddedFolderRef.current,
      );
      if (folderFound && folderFound.id) {
        setSelectedFolderForScope("media" as FolderScope, {
          id: folderFound.id,
          folder_id: folderFound.folder_id,
          scope: "media" as FolderScope,
        });
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
        validate: (val) => (val.length > 1 ? true : "2+ chars"),
      },
    ];

    // setModal2({
    //   ...modal2,
    //   open: true,
    //   showClose: false,
    //   offClickClose: true,
    //   width: "w-[300px]",
    //   maxWidth: "max-w-[400px]",
    //   aspectRatio: "aspect-[5/2]",
    //   borderRadius: "rounded-[12px] md:rounded-[15px]",
    //   content: (
    //     <Modal2MultiStepModalInput
    //       steps={steps}
    //       key={`trigger-${Date.now()}`}
    //       onComplete={async (values) => {
    //         const newIds = await upsertMediaFolders([
    //           {
    //             folder_id: null,
    //             project_idx: currentProjectId,
    //             parent_folder_id: selectedFolder ? selectedFolder.id : null,
    //             name: values.name,
    //             ordinal: null,
    //           } as MediaFolder,
    //         ]);
    //         if (newIds && newIds.length) {
    //           if (selectedFolder && selectedFolder.id) {
    //             setCurrentOpenFolders((prev) =>
    //               new Set(prev).add(selectedFolder.folder_id!),
    //             );
    //           }
    //           newlyAddedFolderRef.current = newIds[0];
    //         }
    //       }}
    //     />
    //   ),
    // });
  };

  const renderFolderIcons = (folder: MediaFolderNode) => {
    if (!folder.folder_id) return;
    const isOpen = currentOpenFolders.has(folder.folder_id);

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

      setHoveredFolder(hovered);
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
            onClick={() =>
              setSelectedFolderForScope("media" as FolderScope, null)
            }
            className="cursor-pointer hover:opacity-[75%] transition-all duration-300 ease-in-out w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]"
          >
            Media
          </p>
        </div>

        <div
          onClick={handleAddFolder}
          className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
          style={{
            backgroundColor: currentTheme.background_1_3,
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
          {/* <SortableContext
            items={folderTree.map((f) => f.id!)}
            strategy={verticalListSortingStrategy}
          >
            {folderTree.map((folder, index) => (
              // <FolderItem key={folder.id} folder={folder} depth={0} />
              <DraggableFolderItem key={index} />
            ))}
          </SortableContext> */}

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
