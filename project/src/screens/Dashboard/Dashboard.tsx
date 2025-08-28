// project/src/screens/Dashboard/Dashboard.tsx
import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext";
import MediaFoldersSidebar from "./MediaFoldersSidebar";
import MediaGrid from "@/screens/Dashboard/MediaGrid";
import MediaToolbar from "./MediaToolbar";
import UploadModal from "@/components/Upload/Upload";
import { Media } from "@/types/media";
import { useAppContext } from "@/contexts/appContext";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { currentProjectId } = useProjectContext();
  const { currentUser } = useContext(AuthContext);
  const { setUploadPopup } = useAppContext();
  const { media, reorderMedia, addMedia, refetchMedia } = useContextQueries();

  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  if (!currentUser || !currentProjectId) return null;

  const filteredMedia: Media[] = activeFolder
    ? media.filter((m: Media) => m.folder_id === activeFolder)
    : media;

  // --- REORDER ---
  const handleReorder = async (newOrder: Media[]) => {
    const orderedIds = newOrder.map((m) => m.id);
    try {
      await reorderMedia({
        folder_id: activeFolder,
        orderedIds,
      });
    } catch (err) {
      console.error(err);
      toast.error("Reorder failed");
      refetchMedia();  
    }
  };

  return (
    <div className="flex w-full h-[100%]">
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
