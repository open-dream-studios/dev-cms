// // project/src/modules/MediaModule/MediaManager.tsx
// import { useState, useContext, useMemo, useRef, useEffect } from "react";
// import { AuthContext } from "@/contexts/authContext";
// import { useContextQueries } from "@/contexts/queryContext/queryContext";
// import MediaFoldersSidebar from "./MediaFoldersSidebar";
// import MediaGrid from "./MediaGrid";
// import MediaToolbar from "./MediaToolbar";
// import UploadModal, { CloudinaryUpload } from "@/components/Upload/Upload";
// import { Media, MediaFolder } from "@/types/media";
// import { collectParentIds } from "@/util/functions/Tree";
// import { useCurrentDataStore } from "@/store/currentDataStore";
// import { useUiStore } from "@/store/useUIStore";
// import { arrayMove } from "@dnd-kit/sortable";
// import {
//   DndContext,
//   closestCenter,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
//   rectIntersection,
//   DragCancelEvent,
//   DragOverEvent,
//   DragStartEvent,
// } from "@dnd-kit/core";
// import { buildFolderTree, MediaFolderNode } from "@/util/functions/Tree";

// const MediaManager = () => {
//   const { currentProjectId } = useCurrentDataStore();
//   const { currentUser } = useContext(AuthContext);
//   const { setUploadPopup } = useUiStore();
//   const { media, upsertMedia, refetchMedia, mediaFolders, upsertMediaFolders } =
//     useContextQueries();

//   const [activeFolder, setActiveFolder] = useState<MediaFolder | null>(null);
//   const [view, setView] = useState<"grid" | "list">("grid");
//   const [editMode, setEditMode] = useState<boolean>(false);
//   const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());

//   function openAllParents(folder: MediaFolder) {
//     const parentIds = collectParentIds(folder, mediaFolders);
//     setOpenFolders((prev) => {
//       const next = new Set(prev);
//       parentIds.forEach((id) => next.add(id));
//       return next;
//     });
//   }

//   // MEDIA GRID
//   // const mediaSensors = useSensors(
//   //   useSensor(PointerSensor, {
//   //     activationConstraint: {
//   //       distance: 5,
//   //     },
//   //   })
//   // );
//   const mediaSensor = useSensor(PointerSensor, {
//     activationConstraint: { distance: 5 },
//   });
//   const filteredMedia: Media[] = useMemo(() => {
//     return activeFolder
//       ? media.filter((m: Media) => m.folder_id === activeFolder.id)
//       : media.filter((m: Media) => m.folder_id === null);
//   }, [media, activeFolder]);

//   const [localMedia, setLocalMedia] = useState<Media[]>([]);
//   const originalMediaRef = useRef<Media[]>([]);
//   useEffect(() => {
//     const sortedMedia = [...filteredMedia].sort(
//       (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
//     );
//     setLocalMedia(sortedMedia);
//     originalMediaRef.current = sortedMedia;
//   }, [filteredMedia]);

//   const handleMediaDragEnd = async (event: DragEndEvent) => {
//     const { active, over } = event;
//     console.log(over);
//     if (!over || active.id === over.id) return;

//     const folderId = activeFolder ? activeFolder.id : null;

//     const siblings = folderId
//       ? localMedia.filter((m) => m.folder_id === folderId)
//       : localMedia.filter((m) => m.folder_id === null);

//     // const oldIndex = siblings.findIndex((m) => m.media_id === active.id);
//     // const newIndex = siblings.findIndex((m) => m.media_id === over.id);
//     const activeIdNum = Number(String(active.id).replace("media-", ""));
//     const overIdNum = Number(String(over.id).replace("media-", ""));

//     const oldIndex = siblings.findIndex(
//       (m) => Number(m.media_id) === activeIdNum
//     );
//     const newIndex = siblings.findIndex(
//       (m) => Number(m.media_id) === overIdNum
//     );
//     if (oldIndex === -1 || newIndex === -1) return;

//     const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

//     setLocalMedia((prev) => {
//       const newState = prev.map((item) => {
//         const idx = newSiblingsOrder.findIndex(
//           (m) => m.media_id === item.media_id
//         );
//         return idx > -1 ? { ...item, ordinal: idx } : item;
//       });
//       return newState.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
//     });

//     const updatedMedia = newSiblingsOrder
//       .map((m, idx) => ({ ...m, ordinal: idx }))
//       .filter((m) => {
//         const original = originalMediaRef.current.find(
//           (om) => om.media_id === m.media_id
//         );
//         return original && original.ordinal !== m.ordinal;
//       });
//     if (updatedMedia.length > 0) {
//       await upsertMedia(updatedMedia);
//     }
//   };

//   // FOLDERS
//   const [activeId, setActiveId] = useState<string | null>(null);
//   // const sensors = useSensors(useSensor(PointerSensor));
//   const folderSensor = useSensor(PointerSensor);
//   const [localFolders, setLocalFolders] = useState<MediaFolder[]>([]);
//   useEffect(() => {
//     if (mediaFolders) {
//       setLocalFolders(
//         [...mediaFolders].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
//       );
//     }
//   }, [mediaFolders]);

//   const folderTree: MediaFolderNode[] = buildFolderTree(localFolders);

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

//   const originalFoldersRef = useRef<MediaFolder[]>([]);
//   useEffect(() => {
//     if (mediaFolders) {
//       originalFoldersRef.current = mediaFolders;
//       setLocalFolders(
//         [...mediaFolders].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
//       );
//     }
//   }, [mediaFolders]);

//   const handleFolderDragEnd = async (event: DragEndEvent) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;

//     const activeIdStr = String(active.id);
//     const overIdStr = String(over.id);

//     const activeNumeric = Number(activeIdStr.replace("folder-", ""));
//     const overNumeric = Number(overIdStr.replace("folder-", ""));

//     const parentId = findParentId(activeNumeric, folderTree);

//     const siblings: MediaFolder[] = parentId
//       ? localFolders.filter((f) => f.parent_folder_id === parentId)
//       : localFolders.filter((f) => f.parent_folder_id === null);

//     const oldIndex = siblings.findIndex((f) => f.id === activeNumeric);
//     const newIndex = siblings.findIndex((f) => f.id === overNumeric);
//     if (oldIndex === -1 || newIndex === -1) return;

//     const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

//     setLocalFolders((prev) =>
//       prev.map((folder) => {
//         const idx = newSiblingsOrder.findIndex((f) => f.id === folder.id);
//         return idx > -1 ? { ...folder, ordinal: idx } : folder;
//       })
//     );

//     const updatedFolders = newSiblingsOrder
//       .map((f, idx) => ({ ...f, ordinal: idx }))
//       .filter((f) => {
//         const original = originalFoldersRef.current.find(
//           (of) => of.id === f.id
//         );
//         return original && original.ordinal !== f.ordinal;
//       });

//     if (updatedFolders.length > 0) {
//       await upsertMediaFolders(updatedFolders);
//     }
//   };

//   // COMBINED
//   const combinedSensors = useSensors(folderSensor, mediaSensor);
//   const getType = (id: string) =>
//     id.startsWith("folder-") ? "folder" : "media";

//   const handleDragStart = (event: DragStartEvent) => {
//     const type = getType(event.active.id.toString());
//     if (type === "folder") {
//       setActiveId(event.active.id.toString());
//     }
//   };

//   const handleDragOver = (event: DragOverEvent) => {
//     const { active, over } = event;
//     if (!over) return;
//     const activeType = getType(active.id.toString());
//     const overType = getType(over.id.toString());
//     if (activeType === "media" && overType === "folder") {
//       console.log("Media is hovering over folder", over.id);
//     }
//   };

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;
//     if (!over) return;

//     const type = getType(active.id.toString());

//     if (type === "folder") {
//       setActiveId(null);
//       handleFolderDragEnd(event);
//     }

//     if (type === "media") {
//       handleMediaDragEnd(event);
//     }
//   };

//   const handleDragCancel = (event: DragCancelEvent) => {
//     setActiveId(null);
//   };

//   if (!currentUser || !currentProjectId) return null;

//   return (
//     <div className="flex w-full h-[100%]">
//       <UploadModal
//         multiple
//         onUploaded={async (uploadObjects: CloudinaryUpload[]) => {
//           const folderImages = activeFolder
//             ? media.filter((m: Media) => m.folder_id === activeFolder.id)
//             : [];
//           const upload_items = uploadObjects.map(
//             (upload: CloudinaryUpload, index: number) => {
//               return {
//                 media_id: null,
//                 project_idx: currentProjectId,
//                 public_id: upload.public_id,
//                 url: upload.url,
//                 type: "image",
//                 folder_id: activeFolder ? activeFolder.id : null,
//                 media_usage: "module",
//                 tags: null,
//                 ordinal: folderImages.length + index,
//               } as Media;
//             }
//           );
//           await upsertMedia(upload_items);
//           refetchMedia();
//         }}
//       />
//       {/* <DndContext
//         sensors={sensors}
//         collisionDetection={rectIntersection}
//         onDragStart={(event) => {
//           setActiveId(event.active.id as number);
//         }}
//         onDragEnd={(event) => {
//           setActiveId(null);
//           handleFolderDragEnd(event);
//         }}
//         onDragCancel={() => setActiveId(null)}
//       > */}
//       <DndContext
//         sensors={combinedSensors}
//         collisionDetection={rectIntersection}
//         onDragStart={handleDragStart}
//         onDragOver={handleDragOver}
//         onDragEnd={handleDragEnd}
//         onDragCancel={handleDragCancel}
//       >
//         <div className="flex-1 flex flex-col">
//           <MediaToolbar
//             view={view}
//             setView={setView}
//             onUploadClick={() => setUploadPopup(true)}
//             editeMode={editMode}
//             setEditMode={setEditMode}
//             activeFolder={activeFolder}
//           />

//           {/* <DndContext
//           sensors={mediaSensors}
//           collisionDetection={closestCenter}
//           onDragEnd={handleMediaDragEnd}
//         > */}
//           <MediaGrid
//             view={view}
//             projectId={currentProjectId}
//             activeFolder={activeFolder}
//             setActiveFolder={setActiveFolder}
//             editMode={editMode}
//             openAllParents={openAllParents}
//             localMedia={localMedia}
//           />
//           {/* </DndContext> */}
//         </div>
//         <MediaFoldersSidebar
//           activeFolder={activeFolder}
//           setActiveFolder={setActiveFolder}
//           openFolders={openFolders}
//           setOpenFolders={setOpenFolders}
//           folderTree={folderTree}
//           activeId={activeId}
//         />
//         {/* </DndContext> */}
//       </DndContext>
//     </div>
//   );
// };

// export default MediaManager;

// project/src/modules/MediaModule/MediaManager.tsx
import { useState, useContext, useMemo, useRef, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import MediaFoldersSidebar from "./MediaFoldersSidebar";
import MediaGrid from "./MediaGrid";
import MediaToolbar from "./MediaToolbar";
import UploadModal, { CloudinaryUpload } from "@/components/Upload/Upload";
import { Media, MediaFolder } from "@/types/media";
import { collectParentIds } from "@/util/functions/Tree";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { arrayMove } from "@dnd-kit/sortable";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  rectIntersection,
  DragCancelEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { buildFolderTree, MediaFolderNode } from "@/util/functions/Tree";

const MediaManager = () => {
  const { currentProjectId } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const { setUploadPopup } = useUiStore();
  const { media, upsertMedia, refetchMedia, mediaFolders, upsertMediaFolders } =
    useContextQueries();

  const [activeFolder, setActiveFolder] = useState<MediaFolder | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());

  function openAllParents(folder: MediaFolder) {
    const parentIds = collectParentIds(folder, mediaFolders);
    setOpenFolders((prev) => {
      const next = new Set(prev);
      parentIds.forEach((id) => next.add(id));
      return next;
    });
  }

  // MEDIA GRID
  // const mediaSensors = useSensors(
  //   useSensor(PointerSensor, {
  //     activationConstraint: {
  //       distance: 5,
  //     },
  //   })
  // );
  const mediaSensor = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );
  const filteredMedia: Media[] = useMemo(() => {
    return activeFolder
      ? media.filter((m: Media) => m.folder_id === activeFolder.id)
      : media.filter((m: Media) => m.folder_id === null);
  }, [media, activeFolder]);

  const [localMedia, setLocalMedia] = useState<Media[]>([]);
  const originalMediaRef = useRef<Media[]>([]);
  useEffect(() => {
    const sortedMedia = [...filteredMedia].sort(
      (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
    );
    setLocalMedia(sortedMedia);
    originalMediaRef.current = sortedMedia;
  }, [filteredMedia]);

  const handleMediaDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log(over);
    if (!over || active.id === over.id) return;

    const folderId = activeFolder ? activeFolder.id : null;

    const siblings = folderId
      ? localMedia.filter((m) => m.folder_id === folderId)
      : localMedia.filter((m) => m.folder_id === null);

    // const oldIndex = siblings.findIndex((m) => m.media_id === active.id);
    // const newIndex = siblings.findIndex((m) => m.media_id === over.id);
    const activeIdNum = Number(String(active.id).replace("media-", ""));
    const overIdNum = Number(String(over.id).replace("media-", ""));

    const oldIndex = siblings.findIndex(
      (m) => Number(m.media_id) === activeIdNum
    );
    const newIndex = siblings.findIndex(
      (m) => Number(m.media_id) === overIdNum
    );
    if (oldIndex === -1 || newIndex === -1) return;

    const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

    setLocalMedia((prev) => {
      const newState = prev.map((item) => {
        const idx = newSiblingsOrder.findIndex(
          (m) => m.media_id === item.media_id
        );
        return idx > -1 ? { ...item, ordinal: idx } : item;
      });
      return newState.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
    });

    const updatedMedia = newSiblingsOrder
      .map((m, idx) => ({ ...m, ordinal: idx }))
      .filter((m) => {
        const original = originalMediaRef.current.find(
          (om) => om.media_id === m.media_id
        );
        return original && original.ordinal !== m.ordinal;
      });
    if (updatedMedia.length > 0) {
      await upsertMedia(updatedMedia);
    }
    setDraggedMedia(null);
  };

  // FOLDERS
  const [activeId, setActiveId] = useState<string | null>(null);
  // const sensors = useSensors(useSensor(PointerSensor));
  const folderSensor = useSensors(useSensor(PointerSensor));
  const [localFolders, setLocalFolders] = useState<MediaFolder[]>([]);
  useEffect(() => {
    if (mediaFolders) {
      setLocalFolders(
        [...mediaFolders].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
      );
    }
  }, [mediaFolders]);

  const folderTree: MediaFolderNode[] = buildFolderTree(localFolders);

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

  const handleFolderDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const activeNumeric = Number(activeIdStr.replace("folder-", ""));
    const overNumeric = Number(overIdStr.replace("folder-", ""));

    const parentId = findParentId(activeNumeric, folderTree);

    const siblings: MediaFolder[] = parentId
      ? localFolders.filter((f) => f.parent_folder_id === parentId)
      : localFolders.filter((f) => f.parent_folder_id === null);

    const oldIndex = siblings.findIndex((f) => f.id === activeNumeric);
    const newIndex = siblings.findIndex((f) => f.id === overNumeric);
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

  const handleFolderDragOver = (event: DragOverEvent) => {
    if (draggedMedia && event.over?.id?.toString().startsWith("folder-")) {
      const folderId = Number(String(event.over.id).replace("folder-", ""));
      console.log("Dragging media over folder:", folderId);
    }
  };

  // COMBINED
  // const combinedSensors = useSensors(folderSensor, mediaSensor);
  const getType = (id: string) =>
    id.startsWith("folder-") ? "folder" : "media";

  const handleDragStart = (event: DragStartEvent) => {
    const type = getType(event.active.id.toString());
    if (type === "folder") {
      setActiveId(event.active.id.toString());
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeType = getType(active.id.toString());
    const overType = getType(over.id.toString());
    if (activeType === "media" && overType === "folder") {
      console.log("Media is hovering over folder", over.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const type = getType(active.id.toString());

    if (type === "folder") {
      setActiveId(null);
      handleFolderDragEnd(event);
    }

    if (type === "media") {
      handleMediaDragEnd(event);
    }
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    setActiveId(null);
  };

  const [draggedMedia, setDraggedMedia] = useState<Media | null>(null);

  const handleMediaDragStart = (event: DragStartEvent) => {
    const mediaId = String(event.active.id).replace("media-", "");
    const item = localMedia.find((m) => m.media_id === mediaId);
    setDraggedMedia(item || null);
  };

  // Then in folder DndContext, watch pointer position or `onDragOver`
  // const handleFolderDragOver = (event: DragOverEvent) => {
  //   if (draggedMedia && event.over?.id?.toString().startsWith("folder-")) {
  //     console.log("Media is hovering over folder", event.over.id);
  //   }
  // };

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <UploadModal
        multiple
        onUploaded={async (uploadObjects: CloudinaryUpload[]) => {
          const folderImages = activeFolder
            ? media.filter((m: Media) => m.folder_id === activeFolder.id)
            : [];
          const upload_items = uploadObjects.map(
            (upload: CloudinaryUpload, index: number) => {
              return {
                media_id: null,
                project_idx: currentProjectId,
                public_id: upload.public_id,
                url: upload.url,
                type: "image",
                folder_id: activeFolder ? activeFolder.id : null,
                media_usage: "module",
                tags: null,
                ordinal: folderImages.length + index,
              } as Media;
            }
          );
          await upsertMedia(upload_items);
          refetchMedia();
        }}
      />
      <DndContext
        sensors={useSensors(
          useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
        )}
        collisionDetection={rectIntersection}
        onDragStart={(event) => {
          const id = String(event.active.id);
          const isMedia = id.startsWith("media-");
          const isFolder = id.startsWith("folder-");
          if (isMedia) handleMediaDragStart(event);
          if (isFolder) setActiveId(id);
        }}
        onDragOver={(event) => {
          const { active, over } = event;
          if (!over) return;
          const activeId = String(active.id);
          const overId = String(over.id);
          const activeType = activeId.startsWith("media-") ? "media" : "folder";
          const overType = overId.startsWith("media-") ? "media" : "folder";

          if (activeType === "media" && overType === "folder") {
            console.log("✅ Media is hovering over folder:", overId);
          }
        }}
        onDragEnd={(event) => {
          const id = String(event.active.id);
          if (id.startsWith("folder-")) handleFolderDragEnd(event);
          if (id.startsWith("media-")) handleMediaDragEnd(event);
          setActiveId(null);
          setDraggedMedia(null);
        }}
        onDragCancel={() => {
          setActiveId(null);
          setDraggedMedia(null);
        }}
      >
        {/* Sidebar + Grid inside one DndContext */}
        <MediaFoldersSidebar
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
          openFolders={openFolders}
          setOpenFolders={setOpenFolders}
          folderTree={folderTree}
          activeId={activeId}
        />

        <div className="flex-1 flex flex-col">
          <MediaToolbar
            view={view}
            setView={setView}
            onUploadClick={() => setUploadPopup(true)}
            editeMode={editMode}
            setEditMode={setEditMode}
            activeFolder={activeFolder}
          />
          <MediaGrid
            view={view}
            projectId={currentProjectId}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            editMode={editMode}
            openAllParents={openAllParents}
            localMedia={localMedia}
          />
        </div>
      </DndContext>
    </div>
  );
};

export default MediaManager;
