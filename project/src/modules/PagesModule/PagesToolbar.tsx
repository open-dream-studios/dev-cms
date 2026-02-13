// project/src/modules/PagesModule/PagesToolbar.tsx
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/contexts/authContext"; 
import { Grid, List, Upload } from "lucide-react";
import { useContext, useMemo } from "react";
import { FiEdit } from "react-icons/fi";
import { useFoldersCurrentDataStore } from "../_util/Folders/_store/folders.store";
import { ProjectFolder } from "@open-dream/shared";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import { useCurrentDataStore } from "@/store/currentDataStore";

type Props = {
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  onUploadClick: () => void;
  editeMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
};

const PagesToolbar = ({
  view,
  setView,
  onUploadClick,
  editeMode,
  setEditMode,
}: Props) => {
  // const folderScope = "media"
  const { currentUser } = useContext(AuthContext);
  // const { selectedFoldersByScope } = useFoldersCurrentDataStore()
  // const { currentProjectId } = useCurrentDataStore()
  // const { projectFolders } = useProjectFolders(!!currentUser, currentProjectId,  {
  //   scope: folderScope,
  //   process_id: null
  // })

  // const selectedFolder = useMemo(()=>{
  //   const selected = selectedFoldersByScope[folderScope]
  //   if (selected && selected?.id) {
  //     return projectFolders.find((folder: ProjectFolder )=> folder.id === selected.id)
  //   }
  //   return null
  // },[]) 

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
        {/* <p className="text-[24px] font-[700] mt-[-2px] px-[10.5px]">{selectedFolder ? selectedFolder.name : "All Media" }</p> */}
      </div>
      <div className="flex gap-2">
        {/* {selectedFolder && <Button
          variant={editeMode ? "default" : "outline"}
          className="cursor-pointer hover:brightness-90 dim"
          onClick={() => setEditMode((prev: boolean) => !prev)}
        >
          <FiEdit />
        </Button>} */}
        {/* <Button
          className="cursor-pointer hover:brightness-90 dim"
          onClick={onUploadClick}
        >
          <Upload size={16} className="mr-1" /> Upload
        </Button> */}
      </div>
    </div>
  );
};

export default PagesToolbar;
