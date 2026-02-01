// project/src/screens/AdminHome/AdminControllers/EditModules.tsx
"use client";
import { useContext, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaChevronLeft } from "react-icons/fa6";
import { useState } from "react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  cleanModuleIdentifier,
  nodeHasChildren,
} from "@/util/functions/Modules";
import { ModuleDefinitionTree } from "@open-dream/shared";

const EditModules = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { moduleDefinitionTree, isLoadingModuleDefinitionTree } =
    useContextQueries();
    
  const [path, setPath] = useState<any[]>([]);

  const currentFolder = useMemo(() => {
    let node = moduleDefinitionTree;
    for (const segment of path) {
      const child = node.children?.find(
        (c: ModuleDefinitionTree) => c.name === segment.name
      );
      if (!child) return node;
      node = child;
    }
    return node;
  }, [moduleDefinitionTree, path]);

  const filteredModules = useMemo(() => {
    if (!currentFolder?.children) return [];
    return currentFolder.children.filter(
      (c: ModuleDefinitionTree) => c.type === "folder"
    );
  }, [currentFolder]);

  const handleModuleClick = (node: ModuleDefinitionTree) => {
    if (node.type === "folder" && nodeHasChildren(node)) {
      setPath([...path, node]);
    }
  };

  const handleBackClick = () => {
    if (path.length === 0) return;
    setPath(path.slice(0, -1));
  };

  if (!currentUser) return null;

  return (
    <div className="w-full flex flex-col gap-[8px] h-[100%] overflow-y-scroll">
      <div className="flex flex-row gap-[5px] items-center mb-[8px] justify-center">
        {path.length !== 0 && (
          <div
            onClick={handleBackClick}
            className="cursor-pointer mt-[-2px] dim hover:brightness-75 flex items-center justify-center h-[33px] rounded-full w-[33px] opacity-[30%]"
          >
            <FaChevronLeft size={22} color={currentTheme.text_3} />
          </div>
        )}
        <h2 className="text-[24px] ml-[2px] font-bold mt-[-5px] mr-[14px]">
          {path.length === 0 ? "Modules" : cleanModuleIdentifier(path[path.length - 1].name)}
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {isLoadingModuleDefinitionTree ? (
          <p>Loading...</p>
        ) : (
          filteredModules.map((node: ModuleDefinitionTree) => (
            <div
              key={node.name}
              style={{
                backgroundColor: currentTheme.background_1_3,
              }}
              className={`${
                nodeHasChildren(node) &&
                "hover:brightness-[88%] dim cursor-pointer"
              } 
                 flex justify-between items-center rounded-[10px] px-[20px] py-[10px] min-h-[50px]`}
              onClick={() => handleModuleClick(node)}
            >
              <div className="w-[calc(100%-90px)] truncate">
                <p className="font-semibold truncate">
                  {cleanModuleIdentifier(node.name)}
                </p>
                <p
                  style={{ color: currentTheme.text_4 }}
                  className="text-sm truncate"
                >
                  {node.name}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EditModules;
