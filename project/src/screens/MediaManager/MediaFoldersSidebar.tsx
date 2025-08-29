// // project/src/components/media/MediaFoldersSidebar.tsx
// "use client";

// import { useEffect, useState } from "react";
// import {
//   DndContext,
//   closestCenter,
//   DragEndEvent,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragOverlay,
//   rectIntersection,
// } from "@dnd-kit/core";
// import {
//   SortableContext,
//   verticalListSortingStrategy,
//   arrayMove,
// } from "@dnd-kit/sortable";
// import { Folder, GripVertical, Plus } from "lucide-react";
// import { useProjectContext } from "@/contexts/projectContext";
// import { useContextQueries } from "@/contexts/queryContext";
// import { buildFolderTree, MediaFolderNode } from "@/util/functions/Tree";
// import FolderItem from "./FolderItem";
// import { MediaFolder } from "@/types/media";
// import { useModal2Store } from "@/store/useModalStore";
// import Modal2MultiStepModalInput, {
//   StepConfig,
// } from "@/modals/Modal2MultiStepInput";
// import { useQueryClient } from "@tanstack/react-query";

// type MediaFoldersSidebarProps = {
//   activeFolder: MediaFolder | null;
//   setActiveFolder: (mediaFolder: MediaFolder | null) => void;
// };

// export default function MediaFoldersSidebar({
//   activeFolder,
//   setActiveFolder,
// }: MediaFoldersSidebarProps) {
//   const { currentProjectId } = useProjectContext();
//   const {
//     mediaFolders,
//     addMediaFolder,
//     reorderMediaFolders,
//     deleteMediaFolder,
//   } = useContextQueries();

//   const queryClient = useQueryClient();
//   const sensors = useSensors(useSensor(PointerSensor));
//   const [localFolders, setLocalFolders] = useState<MediaFolder[]>([]);
//   useEffect(() => {
//     if (mediaFolders) {
//       setLocalFolders(
//         [...mediaFolders].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
//       );
//     }
//   }, [mediaFolders]);

//   const folderTree: MediaFolderNode[] = buildFolderTree(localFolders);

//   const modal2 = useModal2Store((state: any) => state.modal2);
//   const setModal2 = useModal2Store((state: any) => state.setModal2);

//   const [renamingFolder, setRenamingFolder] = useState<number | null>(null);
//   const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
//   const [contextMenu, setContextMenu] = useState<{
//     x: number;
//     y: number;
//     folderId: number | null;
//   } | null>(null);

//   useEffect(() => {
//     const handler = () => setContextMenu(null);
//     window.addEventListener("click", handler);
//     return () => window.removeEventListener("click", handler);
//   }, []);

//   const handleContextMenu = (e: React.MouseEvent, folderId: number) => {
//     e.preventDefault();
//     setContextMenu({
//       x: e.clientX,
//       y: e.clientY,
//       folderId,
//     });
//   };

//   const handleCloseContextMenu = () => setContextMenu(null);

//   const handleDeleteFolder = async () => {
//     if (contextMenu?.folderId) {
//       await deleteMediaFolder(contextMenu.folderId);
//       setContextMenu(null);
//       if (activeFolder && activeFolder.id === contextMenu.folderId) {
//         setActiveFolder(null);
//       }
//       queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
//       queryClient.invalidateQueries({
//         queryKey: ["mediaFolders", currentProjectId],
//       });
//     }
//   };

//   const toggleFolderOpen = (id: number) => {
//     setOpenFolders((prev) => {
//       const next = new Set(prev);
//       if (next.has(id)) {
//         next.delete(id);
//       } else {
//         next.add(id);
//       }
//       return next;
//     });
//   };

//   const findParentId = (
//     id: number,
//     nodes: MediaFolderNode[],
//     parentId: number | null = null
//   ): number | null => {
//     for (const n of nodes) {
//       if (n.id === id) return parentId;
//       if (n.children && n.children.length) {
//         const childResult = findParentId(id, n.children, n.id);
//         if (childResult !== null) return childResult;
//       }
//     }
//     return null;
//   };

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;

//     const parentId = findParentId(active.id as number, folderTree);

//     const siblings: MediaFolder[] = parentId
//       ? localFolders.filter((f) => f.parent_id === parentId)
//       : localFolders.filter((f) => f.parent_id === null);

//     const oldIndex = siblings.findIndex((f) => f.id === active.id);
//     const newIndex = siblings.findIndex((f) => f.id === over.id);
//     if (oldIndex === -1 || newIndex === -1) return;

//     const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

//     setLocalFolders((prev) => {
//       const updated = [...prev];
//       newSiblingsOrder.forEach((f, idx) => {
//         const indexInPrev = updated.findIndex((p) => p.id === f.id);
//         if (indexInPrev > -1) {
//           updated[indexInPrev] = { ...f, ordinal: idx };
//         }
//       });
//       return updated;
//     });

//     reorderMediaFolders({
//       parent_id: parentId,
//       orderedIds: newSiblingsOrder.map((f) => f.id),
//     });
//   };

//   const handleAddFolder = async () => {
//     if (!currentProjectId) return;
//     const steps: StepConfig[] = [
//       {
//         name: "name",
//         placeholder: "Folder Name...",
//         validate: (val) => (val.length > 1 ? true : "2+ characters required"),
//       },
//     ];

//     setModal2({
//       ...modal2,
//       open: true,
//       showClose: false,
//       offClickClose: true,
//       width: "w-[300px]",
//       maxWidth: "max-w-[400px]",
//       aspectRatio: "aspect-[5/2]",
//       borderRadius: "rounded-[12px] md:rounded-[15px]",
//       content: (
//         <Modal2MultiStepModalInput
//           steps={steps}
//           onComplete={async (values) => {
//             const newId = await addMediaFolder({
//               project_idx: currentProjectId,
//               parent_id: activeFolder ? activeFolder.id : null,
//               name: values.name,
//             });
//             if (newId) {
//               if (activeFolder) {
//                 setOpenFolders((prev) => new Set(prev).add(activeFolder.id));
//               }
//               const folderFound = mediaFolders.find(
//                 (mediaFolder: MediaFolder) => mediaFolder.id === newId
//               );
//               if (folderFound) {
//                 setActiveFolder(folderFound);
//               }
//             }
//           }}
//         />
//       ),
//     });
//   };

//   return (
//     <div className="w-60 border-r h-[100%] flex flex-col">
//       {contextMenu && (
//         <div
//           className="fixed z-50 bg-white border shadow-lg rounded-md py-1 w-40 animate-fade-in"
//           style={{ top: contextMenu.y, left: contextMenu.x }}
//           onClick={handleCloseContextMenu}
//         >
//           <button
//             onClick={handleDeleteFolder}
//             className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600"
//           >
//             Delete Folder
//           </button>
//           <button
//             onClick={() => {
//               setRenamingFolder(contextMenu.folderId); // 🔥 New state
//               setContextMenu(null);
//             }}
//             className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
//           >
//             Rename Folder
//           </button>
//         </div>
//       )}
//       <div className="mt-[8px] px-2 w-[100%] flex flex-row justify-between gap-[10px] items-center">
//         <div
//           onClick={() => setActiveFolder(null)}
//           className="cursor-pointer hover:brightness-75 dim"
//         >
//           <p className="text-[20px] font-[700] ml-[5px]">Media</p>
//         </div>

//         <button
//           className="cursor-pointer flex aspect-[1/1] items-center gap-2 px-2 py-2 text-sm bg-[#e9e9e9] hover:bg-gray-100 rounded-full"
//           onClick={handleAddFolder}
//         >
//           <Plus size={16} />
//         </button>
//       </div>
//       <div className="flex-1 overflow-y-auto p-2">
//         <DndContext
//           sensors={sensors}
//           collisionDetection={rectIntersection}
//           onDragEnd={handleDragEnd}
//         >
//           <SortableContext
//             items={folderTree.map((f) => f.id)}
//             strategy={verticalListSortingStrategy}
//           >
//             {folderTree.map((folder) => (
//               <FolderItem
//                 key={folder.id}
//                 folder={folder}
//                 depth={0}
//                 activeFolder={activeFolder}
//                 setActiveFolder={setActiveFolder}
//                 openFolders={openFolders}
//                 toggleFolderOpen={toggleFolderOpen}
//                 onContextMenu={handleContextMenu}
//                 renamingFolder={renamingFolder}
//                 setRenamingFolder={setRenamingFolder}
//               />
//             ))}
//           </SortableContext>

//           <DragOverlay>
//             {activeFolder ? (
//               <div className="flex items-center gap-2 px-2 py-1 bg-white shadow rounded max-h-[32px]">
//                 <GripVertical size={14} className="text-gray-400" />
//                 <div className="w-[13.5px]"></div>
//                 <Folder size={16} className="w-[16px]" />
//                 <span className="truncate">
//                   {localFolders.find((f) => f.id === activeFolder.id)?.name}
//                 </span>
//               </div>
//             ) : null}
//           </DragOverlay>
//         </DndContext>
//       </div>
//     </div>
//   );
// }

// project/src/components/media/MediaFoldersSidebar.tsx
"use client";

import { useEffect, useState } from "react";
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
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext";
import { buildFolderTree, MediaFolderNode } from "@/util/functions/Tree";
import FolderItem from "./FolderItem";
import { MediaFolder } from "@/types/media";
import { useModal2Store } from "@/store/useModalStore";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useQueryClient } from "@tanstack/react-query";

type MediaFoldersSidebarProps = {
  activeFolder: MediaFolder | null;
  setActiveFolder: (mediaFolder: MediaFolder | null) => void;
};

export default function MediaFoldersSidebar({
  activeFolder,
  setActiveFolder,
}: MediaFoldersSidebarProps) {
  const { currentProjectId } = useProjectContext();
  const {
    mediaFolders,
    addMediaFolder,
    reorderMediaFolders,
    deleteMediaFolder,
  } = useContextQueries();

  const queryClient = useQueryClient();
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
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const parentId = findParentId(active.id as number, folderTree);

    const siblings: MediaFolder[] = parentId
      ? localFolders.filter((f) => f.parent_id === parentId)
      : localFolders.filter((f) => f.parent_id === null);

    const oldIndex = siblings.findIndex((f) => f.id === active.id);
    const newIndex = siblings.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

    // setLocalFolders((prev) => {
    //   const updated = [...prev];
    //   newSiblingsOrder.forEach((f, idx) => {
    //     const indexInPrev = updated.findIndex((p) => p.id === f.id);
    //     if (indexInPrev > -1) {
    //       updated[indexInPrev] = { ...f, ordinal: idx };
    //     }
    //   });
    //   return updated;
    // });
    setLocalFolders((prev) =>
      prev.map((folder) => {
        const idx = newSiblingsOrder.findIndex((f) => f.id === folder.id);
        return idx > -1 ? { ...folder, ordinal: idx } : folder;
      })
    );

    reorderMediaFolders({
      parent_id: parentId,
      orderedIds: newSiblingsOrder.map((f) => f.id),
    });
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
            const newId = await addMediaFolder({
              project_idx: currentProjectId,
              parent_id: activeFolder ? activeFolder.id : null,
              name: values.name,
            });
            if (newId) {
              if (activeFolder) {
                setOpenFolders((prev) => new Set(prev).add(activeFolder.id));
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
          <span className="w-[20px]" />
        )}

        {isOpen ? (
          <FolderOpen size={16} className="w-[17px]" />
        ) : (
          <Folder size={16} className="w-[17px]" />
        )}
      </>
    );
  };

  return (
    <div className="w-60 border-r h-[100%] flex flex-col">
      {/* Context Menu */}
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

      {/* Header */}
      <div className="mt-[8px] px-2 w-[100%] flex flex-row justify-between gap-[10px] items-center">
        <div
          onClick={() => setActiveFolder(null)}
          className="cursor-pointer hover:brightness-75 dim"
        >
          <p className="text-[20px] font-[700] ml-[5px]">Media</p>
        </div>

        <button
          className="cursor-pointer flex aspect-[1/1] items-center gap-2 px-2 py-2 text-sm bg-[#e9e9e9] hover:bg-gray-100 rounded-full"
          onClick={handleAddFolder}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
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
                openFolders={openFolders}
                toggleFolderOpen={toggleFolderOpen}
                onContextMenu={handleContextMenu}
                renamingFolder={renamingFolder}
                setRenamingFolder={setRenamingFolder}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeFolder
              ? (() => {
                  const findNode = (
                    nodes: MediaFolderNode[],
                    id: number
                  ): MediaFolderNode | null => {
                    for (const node of nodes) {
                      if (node.id === id) return node;
                      if (node.children?.length) {
                        const found = findNode(node.children, id);
                        if (found) return found;
                      }
                    }
                    return null;
                  };

                  const activeNode = findNode(folderTree, activeFolder.id);
                  console.log(activeNode, folderTree, activeFolder.id);
                  if (!activeNode) return null;

                  return (
                    <div className="flex items-center gap-2 px-2 py-1 bg-white shadow rounded max-h-[32px]">
                      <GripVertical size={14} className="text-gray-400" />
                      {renderFolderIcons(activeNode)}{" "}
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
