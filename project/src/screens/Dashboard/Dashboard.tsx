// project/src/screens/Dashboard/Dashboard.tsx
import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext";
import MediaFoldersSidebar from "./MediaFoldersSidebar";
import MediaGrid from "./MediaGrid";
import MediaToolbar from "./MediaToolbar";
import UploadModal from "@/components/Upload/Upload";
import { Media } from "@/types/media";
import { useAppContext } from "@/contexts/appContext";
import { reorderMedia } from "@/api/media"; // new API fn
import { toast } from "react-toastify";

const Dashboard = () => {
  const { currentProjectId } = useProjectContext();
  const { currentUser } = useContext(AuthContext);
  const { uploadPopup, setUploadPopup } = useAppContext();
  const { media, mediaFolders, addMedia, refetchMedia } = useContextQueries();

  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  if (!currentUser || !currentProjectId) return null;

  const filteredMedia: Media[] = activeFolder
    ? media.filter((m: Media) => m.folder_id === activeFolder)
    : media;

  // --- UPLOAD ---
  const handleUpload = async (files: File[], uploadedUrls: string[]) => {
    try {
      await Promise.all(
        files.map((file, i) =>
          addMedia({
            project_idx: currentProjectId,
            url: uploadedUrls[i],
            type: file.type.startsWith("image") ? "image" : "video",
            alt_text: file.name,
            folder_id: activeFolder,
            media_usage: "general",
            metadata: { size: file.size },
          })
        )
      );
      refetchMedia();
      setUploadPopup(false);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }
  };

  // --- REORDER ---
  const handleReorder = async (newOrder: Media[]) => {
    const orderedIds = newOrder.map((m) => m.id);
    try {
      await reorderMedia(currentProjectId, activeFolder, orderedIds);
    } catch (err) {
      console.error(err);
      toast.error("Reorder failed");
      refetchMedia(); // fallback refresh
    }
  };

  return (
    <div className="flex w-full h-[100vh]">
      <UploadModal
        multiple
        onClose={() => setUploadPopup(false)}
        onUploaded={(urls: string[]) => {
          urls.forEach((url) => {
            addMedia({
              project_idx: currentProjectId,
              url,
              type: "image",
              folder_id: activeFolder,
              media_usage: "general",
            });
          });
          refetchMedia();
        }}
      />

      <MediaFoldersSidebar
        folders={mediaFolders}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
      />

      <div className="flex-1 flex flex-col">
        <MediaToolbar
          view={view}
          setView={setView}
          onUploadClick={() => setUploadPopup(true)}
        />

        <MediaGrid
          media={filteredMedia}
          view={view}
          projectId={currentProjectId}
          onReorder={handleReorder}
        />
      </div>
    </div>
  );
};

export default Dashboard;