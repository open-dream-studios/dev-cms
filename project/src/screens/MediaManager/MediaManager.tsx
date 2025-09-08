// project/src/screens/MediaManager/MediaManager.tsx
import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import MediaFoldersSidebar from "../MediaManager/MediaFoldersSidebar";
import MediaGrid from "@/screens/MediaManager/MediaGrid";
import MediaToolbar from "../MediaManager/MediaToolbar";
import UploadModal, { CloudinaryUpload } from "@/components/Upload/Upload";
import { Media, MediaFolder, MediaInsert } from "@/types/media";
import { useAppContext } from "@/contexts/appContext";
import { collectParentIds } from "@/util/functions/Tree";

const MediaManager = () => {
  const { currentProjectId } = useProjectContext();
  const { currentUser } = useContext(AuthContext);
  const { setUploadPopup } = useAppContext();
  const { media, reorderMedia, addMedia, refetchMedia, mediaFolders } =
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

  if (!currentUser || !currentProjectId) return null;

  const filteredMedia: Media[] = activeFolder
    ? media.filter((m: Media) => m.folder_id === activeFolder.id)
    : media;

  const handleReorder = (newOrder: Media[]) => {
    if (!activeFolder) return;
    reorderMedia({
      folder_id: activeFolder.id,
      orderedIds: newOrder.map((m) => m.id),
    });
  };

  return (
    <div className="flex w-full h-[100%]">
      <UploadModal
        multiple
        onClose={() => setUploadPopup(false)}
        onUploaded={async (uploadObjects: CloudinaryUpload[]) => {
          if (!activeFolder) return;
          const upload_items = uploadObjects.map((upload: CloudinaryUpload) => {
            return {
              project_idx: currentProjectId,
              public_id: upload.public_id,
              url: upload.url,
              type: "image",
              folder_id: activeFolder.id,
              media_usage: "general",
            } as MediaInsert;
          });
          await addMedia(upload_items);
          refetchMedia();
        }}
      />

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
          onUploadClick={() => setUploadPopup(true)}
          editeMode={editMode}
          setEditMode={setEditMode}
          activeFolder={activeFolder}
        />

        <MediaGrid
          media={filteredMedia}
          view={view}
          projectId={currentProjectId}
          onReorder={handleReorder}
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
