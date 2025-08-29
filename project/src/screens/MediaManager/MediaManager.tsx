// project/src/screens/Dashboard/Dashboard.tsx
import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext";
import MediaFoldersSidebar from "../MediaManager/MediaFoldersSidebar";
import MediaGrid from "@/screens/MediaManager/MediaGrid";
import MediaToolbar from "../MediaManager/MediaToolbar";
import UploadModal, { CloudinaryUpload } from "@/components/Upload/Upload";
import { Media } from "@/types/media";
import { useAppContext } from "@/contexts/appContext";

const MediaManager = () => {
  const { currentProjectId } = useProjectContext();
  const { currentUser } = useContext(AuthContext);
  const { setUploadPopup } = useAppContext();
  const { media, reorderMedia, addMedia, refetchMedia } = useContextQueries();

  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editMode, setEditMode] = useState<boolean>(false);

  if (!currentUser || !currentProjectId) return null;

  const filteredMedia: Media[] = activeFolder
    ? media.filter((m: Media) => m.folder_id === activeFolder)
    : media;

  const handleReorder = (newOrder: Media[]) => {
    reorderMedia({
      folder_id: activeFolder,
      orderedIds: newOrder.map((m) => m.id),
    });
  };

  return (
    <div className="flex w-full h-[100%]">
      <UploadModal
        multiple
        onClose={() => setUploadPopup(false)}
        onUploaded={(uploads: CloudinaryUpload[]) => {
          uploads.forEach((upload: CloudinaryUpload) => {
            addMedia({
              project_idx: currentProjectId,
              public_id: upload.public_id,
              url: upload.url,
              type: "image",
              folder_id: activeFolder,
              media_usage: "general",
            });
          });
          refetchMedia();
        }}
      />

      <MediaFoldersSidebar
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
      />

      <div className="flex-1 flex flex-col">
        <MediaToolbar
          view={view}
          setView={setView}
          onUploadClick={() => setUploadPopup(true)}
          editeMode={editMode}
          setEditMode={setEditMode}
        />

        <MediaGrid
          media={filteredMedia}
          view={view}
          projectId={currentProjectId}
          onReorder={handleReorder}
          activeFolder={activeFolder}
          editMode={editMode}
        />
      </div>
    </div>
  );
};

export default MediaManager;
