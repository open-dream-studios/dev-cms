// project/src/screens/Dashboard/MediaToolbar.tsx
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/contexts/authContext";
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
};

const MediaToolbar = ({
  view,
  setView,
  onUploadClick,
  editeMode,
  setEditMode,
}: Props) => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return null;

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex gap-2">
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
