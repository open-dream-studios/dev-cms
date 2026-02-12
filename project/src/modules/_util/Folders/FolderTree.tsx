// project/src/modules/_util/Folders/FolderTree.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import {
  buildNormalizedTree,
  flattenFromNormalizedTree,
} from "@/modules/_util/Folders/_helpers/folders.helpers";
import { useCurrentDataStore } from "@/store/currentDataStore";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EstimationFactDefinition, FolderScope } from "@open-dream/shared";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  setFolderTreeByScope,
  setSelectedFolderForScope,
  useFoldersCurrentDataStore,
} from "./_store/folders.store";
import DraggableFolderItem from "@/modules/_util/Folders/DraggableFolderItem";
import VariableDraggableItem from "@/modules/EstimationModule/components/VariableDraggableItem";
import ProcessDraggableItem from "@/modules/EstimationModule/components/ProcessDraggableItem";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";

const FolderTree = ({ folderScope }: { folderScope: FolderScope }) => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();

  const { projectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    { scope: folderScope, process_id: currentProcessId },
  );

  // NEW ATTEMPT
  const { folderTreesByScope, currentOpenFolders } =
    useFoldersCurrentDataStore();

  useEffect(() => {
    const existing = folderTreesByScope[folderScope];
    const next = buildNormalizedTree(projectFolders);
    if (!existing) {
      setFolderTreeByScope(folderScope, next);
      return;
    }
    const same =
      JSON.stringify(existing.nodesById) === JSON.stringify(next.nodesById) &&
      JSON.stringify(existing.childrenByParent) ===
        JSON.stringify(next.childrenByParent);
    if (!same) {
      setFolderTreeByScope(folderScope, next);
    }
  }, [folderScope, projectFolders]);

  const tree = folderTreesByScope[folderScope];

  const flat = useMemo(() => {
    if (!tree) return [];
    return flattenFromNormalizedTree(tree, currentOpenFolders);
  }, [tree, currentOpenFolders]);

  // const { setSelectedFolder, flatFolderTreeRef, flatTreesByScope } =
  //   useFoldersCurrentDataStore();
  // const computedFlat = useMemo(() => {
  //   const tree = buildFolderTree(
  //     projectFolders,
  //     estimationProcesses,
  //     folderScope,
  //   );
  //   return flattenFolderTree(tree, currentOpenFolders);
  // }, [projectFolders, estimationProcesses, folderScope, currentOpenFolders]);

  // const flat = flatTreesByScope[folderScope] ?? computedFlat;

  // useEffect(() => {
  //   flatFolderTreeRef.current = flat;
  // }, [flat]);

  // useEffect(() => {
  //   const current = flatTreesByScope[folderScope];
  //   if (
  //     current &&
  //     current.length === computedFlat.length &&
  //     current.every((f, i) => f.id === computedFlat[i].id)
  //   ) {
  //     return;
  //   }
  //   setFlatTreeForScope(folderScope, computedFlat);
  // }, [computedFlat, folderScope]);

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
    setSelectedFolderForScope(folderScope, null);
  });

  return (
    <div ref={containerRef} className="px-[4px] flex-1 overflow-y-auto w-full pt-[1px]">
      <SortableContext
        items={flat.filter((f) => f.type === "folder").map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        {flat.map((f, index) => {
          if (f.type === "folder") {
            return (
              <DraggableFolderItem key={f.id} flat={f} scope={folderScope} />
            );
          }

          return (
            <div
              key={f.id}
              style={{ marginLeft: `${Math.max(f.depth - 1, 0) * 10}px` }}
            >
              {folderScope === "estimation_fact_definition" && (
                <VariableDraggableItem
                  fact={f.item as EstimationFactDefinition}
                />
              )}
              {folderScope === "estimation_process" && (
                <ProcessDraggableItem
                  index={index}
                  estimationProcess={f.item as EstimationProcess}
                />
              )}
            </div>
          );
        })}
      </SortableContext>
    </div>
  );
};

export default FolderTree;
