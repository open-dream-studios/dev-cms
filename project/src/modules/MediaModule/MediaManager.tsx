// project/src/modules/MediaModule/MediaManager.tsx
import { useState, useContext, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import MediaFoldersSidebar from "./MediaFoldersSidebar";
import MediaGrid from "./MediaGrid";
import MediaToolbar from "./MediaToolbar";
import { Media } from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useFoldersCurrentDataStore } from "../_util/Folders/_store/folders.store";

const MediaManager = () => {
  const { currentProjectId } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const { selectedFoldersByScope } = useFoldersCurrentDataStore();

  const { media } = useContextQueries();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editMode, setEditMode] = useState<boolean>(false);

  const filteredMedia: Media[] = useMemo(() => {
    const selected = selectedFoldersByScope?.["media"];
    if (selected?.id) {
      return media.filter((m: Media) => m.folder_id === selected.id);
    }
    return media.filter((m: Media) => m.folder_id === null);
  }, [media, selectedFoldersByScope]);

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
        />
      </div>
    </div>
  );
};

export default MediaManager;
