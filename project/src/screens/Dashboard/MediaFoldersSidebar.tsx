// project/src/screens/Dashboard/MediaFoldersSidebar.tsx
import { useState } from "react";
import { IoFolderOutline, IoFolderOpenOutline } from "react-icons/io5";
import { MediaFolder } from "@/types/media";

type FolderNodeProps = {
  folder: MediaFolder;
  activeFolder: number | null;
  setActiveFolder: (id: number | null) => void;
};

const FolderNode = ({ folder, activeFolder, setActiveFolder }: FolderNodeProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="ml-2">
      <div
        className={`flex items-center gap-2 p-1 cursor-pointer ${
          activeFolder === folder.id ? "bg-gray-200 rounded" : ""
        }`}
        onClick={() => setActiveFolder(folder.id)}
      >
        <span onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? <IoFolderOpenOutline /> : <IoFolderOutline />}
        </span>
        {folder.name}
      </div>
      {expanded &&
        (folder as any).children?.map((child: MediaFolder) => (
          <FolderNode
            key={child.id}
            folder={child}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
          />
        ))}
    </div>
  );
};

type SidebarProps = {
  folders: MediaFolder[];
  activeFolder: number | null;
  setActiveFolder: (id: number | null) => void;
};

const MediaFoldersSidebar = ({ folders, activeFolder, setActiveFolder }: SidebarProps) => (
  <div className="w-[250px] border-r p-3 overflow-y-auto">
    <h3 className="font-bold mb-2">Folders</h3>
    <div>
      {folders.map((f) => (
        <FolderNode
          key={f.id}
          folder={f}
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
        />
      ))}
    </div>
  </div>
);

export default MediaFoldersSidebar;