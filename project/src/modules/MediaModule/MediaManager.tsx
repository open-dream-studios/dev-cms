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
  const {
    currentActiveFolder,
    setCurrentActiveFolder,
    currentOpenFolders,
    setCurrentOpenFolders,
  } = useCurrentDataStore();

  const { media, mediaFolders } = useContextQueries();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editMode, setEditMode] = useState<boolean>(false);

  function openAllParents(folder: MediaFolder) {
    const parentIds = collectParentIds(folder, mediaFolders);
    setCurrentOpenFolders((prev) => {
      const next = new Set(prev);
      parentIds.forEach((id) => next.add(id));
      return next;
    });
  }

  const filteredMedia: Media[] = useMemo(() => {
    return currentActiveFolder
      ? media.filter((m: Media) => m.folder_id === currentActiveFolder.id)
      : media.filter((m: Media) => m.folder_id === null);
  }, [media, currentActiveFolder]);

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%] overflow-hidden">
      <MediaFoldersSidebar />

      <div className="flex-1 flex flex-col">
        <MediaToolbar
          view={view}
          setView={setView}
          editeMode={editMode}
          setEditMode={setEditMode}
        />

        <MediaGrid
          filteredMedia={filteredMedia}
          view={view}
          projectId={currentProjectId}
          editMode={editMode}
          openAllParents={openAllParents}
        />
      </div>
    </div>
  );
};

export default MediaManager;
