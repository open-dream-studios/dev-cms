// project/src/modules/MediaModule/MediaManager.tsx
import { useState, useContext, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import MediaFoldersSidebar from "./MediaFoldersSidebar";
import MediaGrid from "./MediaGrid";
import MediaToolbar from "./MediaToolbar";
import UploadModal, { CloudinaryUpload } from "@/components/Upload/Upload";
import { Media, MediaFolder } from "@shared/types/models/media";
import { collectParentIds } from "@/util/functions/Tree";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";

const MediaManager = () => {
  const { currentProjectId } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const { setUploadPopup } = useUiStore();
  const { media, upsertMedia, refetchMedia, mediaFolders } =
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

  const filteredMedia: Media[] = useMemo(() => {
    return activeFolder
      ? media.filter((m: Media) => m.folder_id === activeFolder.id)
      : media.filter((m: Media) => m.folder_id === null);
  }, [media, activeFolder]);

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
                ordinal: null
              } as Media;
            }
          );
          await upsertMedia(upload_items);
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
