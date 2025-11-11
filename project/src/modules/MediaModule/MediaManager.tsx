// project/src/modules/MediaModule/MediaManager.tsx
import { useState, useContext, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import MediaFoldersSidebar from "./MediaFoldersSidebar";
import MediaGrid from "./MediaGrid";
import MediaToolbar from "./MediaToolbar"; 
import { Media, MediaFolder } from "@open-dream/shared";
import { collectParentIds } from "@/util/functions/Tree";
import { useCurrentDataStore } from "@/store/currentDataStore"; 

const MediaManager = () => {
  const { currentProjectId } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);

  const { media, mediaFolders } = useContextQueries();

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

  const filteredMedia: Media[] = useMemo(() => {
    return activeFolder
      ? media.filter((m: Media) => m.folder_id === activeFolder.id)
      : media.filter((m: Media) => m.folder_id === null);
  }, [media, activeFolder]);

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%] overflow-hidden">
      <MediaFoldersSidebar
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        openFolders={openFolders}
        setOpenFolders={setOpenFolders}
      />

      <div className="flex-1 flex flex-col">
        <MediaToolbar
          view={view}
          setView={setView}
          editeMode={editMode}
          setEditMode={setEditMode}
          activeFolder={activeFolder}
        />

        <MediaGrid
          filteredMedia={filteredMedia}
          view={view}
          projectId={currentProjectId}
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
          editMode={editMode}
          openAllParents={openAllParents}
        />
      </div>
    </div>
  );
};

export default MediaManager;
