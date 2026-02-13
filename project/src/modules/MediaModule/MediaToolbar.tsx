// project/src/modules/MediaModule/MediaToolbar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import CustomButton from "@/lib/blocks/CustomButton";
import {
  setCurrentMediaItemsSelected,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { setUploadContext, useUiStore } from "@/store/useUIStore";
import { Grid, List, Upload } from "lucide-react";
import { useContext, useMemo } from "react";
import { FiEdit } from "react-icons/fi";
import { useFoldersCurrentDataStore } from "../_util/Folders/_store/folders.store";
import { FolderScope, ProjectFolder } from "@open-dream/shared";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";

type Props = {
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  editeMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
};

const MediaToolbar = ({ view, setView, editeMode, setEditMode }: Props) => {
  const folderScope = "media";
  const currentTheme = useCurrentTheme()
  const { currentUser } = useContext(AuthContext);
  const { selectedFoldersByScope } = useFoldersCurrentDataStore();
  const { currentProjectId } = useCurrentDataStore();
  const { projectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId,
    {
      scope: folderScope,
      process_id: null,
    },
  );

  const selectedFolder = useMemo(() => {
    const selected = selectedFoldersByScope[folderScope];
    if (selected && selected?.id) {
      return projectFolders.find(
        (folder: ProjectFolder) => folder.id === selected.id,
      );
    }
    return null;
  }, []);

  const onUploadClick = () => {
    setUploadContext({
      visible: true,
      multiple: true,
      usage: "module",
      folder_id: selectedFoldersByScope[folderScope]?.id ?? null,
      onUploaded: async () => {},
    });
  };
  if (!currentUser) return null;

  return (
    <div
      className="flex items-center justify-end md:justify-between px-4 py-2"
      style={{
        borderBottom: `0.5px solid ${currentTheme.background_2}`,
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
          {selectedFolder ? selectedFolder.name : "No Folder"}
        </p>
      </div>
      <div className="flex gap-2">
        <CustomButton
          onClick={() => {
            setEditMode((prev) => !prev);
            setCurrentMediaItemsSelected([]);
          }}
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
