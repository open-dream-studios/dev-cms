// project/src/modules/_util/Folders/FolderTree.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useEstimationProcesses } from "@/contexts/queryContext/queries/estimations/process/estimationProcess";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import {
  buildFolderTree,
  flattenFolderTree,
} from "@/modules/_util/Folders/_helpers/folders.helpers";
import { useCurrentDataStore } from "@/store/currentDataStore";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FolderScope } from "@open-dream/shared";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  setFlatTreeForScope,
  useFoldersCurrentDataStore,
} from "./_store/folders.store";
import DraggableFolderItem from "@/modules/_util/Folders/DraggableFolderItem";

const FolderTree = ({ folderScope }: { folderScope: FolderScope }) => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const {
    currentOpenFolders,
    setSelectedFolder,
    flatFolderTreeRef,
    flatTreesByScope,
  } = useFoldersCurrentDataStore();

  const { projectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    { scope: folderScope, process_id: currentProcessId },
  );

  const { estimationProcesses } = useEstimationProcesses(
    !!currentUser,
    currentProjectId,
  );

  const computedFlat = useMemo(() => {
    const tree = buildFolderTree(
      projectFolders,
      estimationProcesses,
      folderScope,
    );
    return flattenFolderTree(tree, currentOpenFolders);
  }, [projectFolders, estimationProcesses, folderScope, currentOpenFolders]);

  const flat = flatTreesByScope[folderScope] ?? computedFlat;

  useEffect(() => {
    flatFolderTreeRef.current = flat;
  }, [flat]);

  useEffect(() => {
    setFlatTreeForScope(folderScope, computedFlat);
  }, [computedFlat, folderScope]);

  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, (e: React.PointerEvent) => {
    const el = e.target as HTMLElement;
    if (
      el.closest("[data-folder-item]") ||
      el.closest("[data-leftbar-button]") ||
      el.closest("[data-modal]")
    ) {
      return;
    }
    setSelectedFolder(null);
  });

  return (
    <div ref={containerRef} className="px-[4px] flex-1 overflow-y-auto w-full">
      <SortableContext
        items={flat.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        {flat.map((f) => (
          <DraggableFolderItem key={f.id} flat={f} scope={folderScope} />
        ))}
      </SortableContext>
    </div>
  );
};

export default FolderTree;
