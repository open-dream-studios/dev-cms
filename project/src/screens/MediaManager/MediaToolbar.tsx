// project/src/screens/Dashboard/MediaToolbar.tsx
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/contexts/authContext";
import { MediaFolder } from "@/types/media";
import { appTheme } from "@/util/appTheme";
import { Grid, List, Upload } from "lucide-react";
import { useContext } from "react";
import { FiEdit } from "react-icons/fi";

type Props = {
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  onUploadClick: () => void;
  editeMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  activeFolder: MediaFolder | null;
};

const MediaToolbar = ({
  view,
  setView,
  onUploadClick,
  editeMode,
  setEditMode,
  activeFolder
}: Props) => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return null;

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex gap-2 items-center ml-[1px]">
        <Button
          className="cursor-pointer hover:brightness-90 dim"
          variant={view === "grid" ? "default" : "outline"}
          onClick={() => setView("grid")}
        >
          <Grid size={16} className="mr-1" /> Grid
        </Button>
        <Button
          className="cursor-pointer hover:brightness-90 dim"
          variant={view === "list" ? "default" : "outline"}
          onClick={() => setView("list")}
        >
          <List size={16} className="mr-1" /> List
        </Button>
        <p className="text-[24px] font-[700] mt-[-2px] px-[10.5px]">{activeFolder ? activeFolder.name : "All Media" }</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant={editeMode ? "default" : "outline"}
          className="cursor-pointer hover:brightness-90 dim"
          onClick={() => setEditMode((prev: boolean) => !prev)}
        >
          <FiEdit />
        </Button>
        <Button
          className="cursor-pointer hover:brightness-90 dim"
          onClick={onUploadClick}
        >
          <Upload size={16} className="mr-1" /> Upload
        </Button>
      </div>
    </div>
  );
};

export default MediaToolbar;
