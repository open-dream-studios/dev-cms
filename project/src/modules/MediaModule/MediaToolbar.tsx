// project/src/modules/MediaModule/MediaToolbar.tsx
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/contexts/authContext";
import CustomButton from "@/lib/blocks/CustomButton";
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
  activeFolder,
}: Props) => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return null;

  return (
    <div
      className="flex items-center justify-end md:justify-between px-4 py-2"
      style={{
        borderBottom: `0.5px solid ${appTheme[currentUser.theme].background_2}`,
      }}
    >
      <div className="hidden md:flex gap-2 items-center ml-[1px]">
        <CustomButton
          onClick={() => setView("grid")}
          variant="switch"
          active={view === "grid"}
        >
          <Grid size={15} />
          <p className="font-[500] text-[14px]">Grid</p>
        </CustomButton>

        <CustomButton
          onClick={() => setView("list")}
          variant="switch"
          active={view === "list"}
        >
          <List size={17} />
          <p className="font-[500] text-[14px]">List</p>
        </CustomButton>

        <p className="text-[24px] font-[700] mt-[-2px] px-[10.5px]">
          {activeFolder ? activeFolder.name : "No Folder"}
        </p>
      </div>
      <div className="flex gap-2">
        <CustomButton
          onClick={() => setEditMode((prev) => !prev)}
          variant="outline"
        >
          <FiEdit size={16} />
        </CustomButton>

        <CustomButton onClick={onUploadClick} variant="fill">
          <Upload size={16} />
          <p className="font-[500] text-[14px]">Upload</p>
        </CustomButton>
      </div>
    </div>
  );
};

export default MediaToolbar;
