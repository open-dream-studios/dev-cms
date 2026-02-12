// project/src/modules/_util/Folders/_hooks/folders.hooks.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { FolderInput, FolderScope, ProjectFolder } from "@open-dream/shared";
import { useContext, useRef } from "react";
import { openFolder } from "../_actions/folders.actions";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  FolderTreeState,
  ProjectFolderNode,
  resetDragUI,
  setFlatTreeForScope,
  setFolderTreeByScope,
  useFoldersCurrentDataStore,
} from "../_store/folders.store";
import {
  closeFolderTreeBranch,
  computeDropTarget,
  flattenFromNormalizedTree,
  moveFolderLocal,
} from "../_helpers/folders.helpers";
import { arrayMove } from "@dnd-kit/sortable";

export function useProjectFolderHooks(scope: FolderScope) {
  const { currentUser } = useContext(AuthContext);
  const { modal2, setModal2 } = useUiStore();
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const { projectFolders, upsertProjectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    {
      scope,
      process_id: currentProcessId,
    },
  );
  const { selectedFoldersByScope } = useFoldersCurrentDataStore();

  const handleAddFolder = async (scope: FolderScope) => {
    if (!currentProjectId) return;
    const steps: StepConfig[] = [
      {
        name: "name",
        placeholder: "Folder Name...",
        validate: (val) => (val.length > 1 ? true : "2+ chars"),
      },
    ];

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          steps={steps}
          key={`trigger-${Date.now()}`}
          onComplete={async (values) => {
            const folderSelected = selectedFoldersByScope[scope];
            await upsertProjectFolders([
              {
                folder_id: null,
                scope,
                parent_folder_id:
                  folderSelected && folderSelected.id
                    ? folderSelected.id
                    : null,
                name: values.name,
                ordinal: null,
                process_id: currentProcessId,
              },
            ]);
            if (folderSelected && folderSelected.id) {
              const matchedFolder = projectFolders.find(
                (folder: ProjectFolder) => folder.id === folderSelected.id,
              );
              if (matchedFolder) {
                openFolder(matchedFolder);
              }
            }
          }}
        />
      ),
    });
  };

  const handleEditFolder = (node: ProjectFolderNode) => {
    const matchedFolder = projectFolders.find(
      (folder: ProjectFolder) => folder.folder_id === node.folder_id,
    );
    if (!matchedFolder) return;
    const EditFolderSteps: StepConfig[] = [
      {
        name: "name",
        initialValue: matchedFolder.name ?? "",
        placeholder: `Folder Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
    ];

    const onComplete = async (values: any) => {
      await upsertProjectFolders([
        {
          ...matchedFolder,
          name: values.name,
        },
      ]);
    };

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          key={`edit-folder-${Date.now()}`}
          steps={EditFolderSteps}
          onComplete={onComplete}
        />
      ),
    });
  };

  return {
    handleAddFolder,
    handleEditFolder,
  };
}

export function useFolderDndHandlers() {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const {
    setDraggingFolderId,
    setDraggingFolderDepth,
    folderTreesByScope,
    flatFolderTreeRef,
    currentOpenFolders,
    edgeHoverFolderId,
    setEdgeHoverFolderId,
  } = useFoldersCurrentDataStore();

  const folderScope: FolderScope = currentProcessId
    ? "estimation_fact_definition"
    : "estimation_process";

  const { moveProjectFolder } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    {
      scope: folderScope,
      process_id: currentProcessId,
    },
  );
  const snapshotRef = useRef<FolderTreeState | null>(null);

  const hasChildren = (folderNumericId: number) => {
    const tree = folderTreesByScope[folderScope];
    if (!tree) return false;
    const children = tree.childrenByParent[folderNumericId];
    return !!children && children.length > 0;
  };

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    if (data?.kind !== "FOLDER") return;
    setDraggingFolderId(data.folder.folder_id);
    setDraggingFolderDepth(data.depth);
    closeFolderTreeBranch(folderScope, data.folder.id);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const activeData = e.active.data.current;
    if (activeData?.kind !== "FOLDER") return;

    const dragged = activeData.folder;
    const oldParentId = dragged.parent_folder_id ?? null;

    // --------------------------------------------
    // CASE 1 — dropped ONTO folder (white border)
    // --------------------------------------------
    if (edgeHoverFolderId && edgeHoverFolderId !== "__root__") {
      const tree = folderTreesByScope[folderScope];
      if (!tree) return;

      const flat = flattenFromNormalizedTree(tree, currentOpenFolders);

      // const targetFlat = flat.find(
      //   (f) => String(f.node.folder_id) === String(edgeHoverFolderId),
      // );
      const targetFlat = flat.find(
        (f): f is Extract<typeof f, { type: "folder" }> =>
          f.type === "folder" &&
          String(f.node.folder_id) === String(edgeHoverFolderId),
      );

      if (!targetFlat) return;

      const newParentId = targetFlat.node.id === -1 ? null : targetFlat.node.id;

      // prevent self-parent
      if (newParentId === dragged.id) {
        setEdgeHoverFolderId(null);
        return;
      }

      // prevent no-op (same parent)
      if (newParentId === (dragged.parent_folder_id ?? null)) {
        setEdgeHoverFolderId(null);
        return;
      }

      console.log({
        type: "MOVE_INTO_FOLDER_APPEND",
        dragged_folder_id: dragged.folder_id,
        old_parent_id: oldParentId,
        new_parent_id: newParentId,
      });

      // useFoldersCurrentDataStore.getState().set({
      //   edgeHoverFolderId: null,
      // });

      // const reordered = flat.filter((f) => {
      //   if (f.type !== "folder") return true;
      //   return f.node.folder_id !== dragged.folder_id;
      // });
      // setFlatTreeForScope(folderScope, reordered);

      // moveProjectFolder({
      //   folder_id: dragged.folder_id,
      //   project_idx: currentProjectId,
      //   process_id: currentProcessId,
      //   scope: folderScope,
      //   parent_folder_id: newParentId,
      //   name: dragged.name,
      //   ordinal: null,
      // } as FolderInput);
      resetDragUI();
      return;
    }

    // --------------------------------------------
    // CASE 2 — dropped BETWEEN (true reorder)
    // --------------------------------------------
    const tree = folderTreesByScope[folderScope];
    if (!tree) return;
    const flat = flattenFromNormalizedTree(tree, currentOpenFolders);

    const activeId = e.active.id;
    const overId = e.over?.id;
    if (!overId) return;

    const oldIndex = flat.findIndex((f) => f.id === activeId);
    const overIndex = flat.findIndex((f) => f.id === overId);

    if (oldIndex === -1 || overIndex === -1) return;

    // simulate final UI order exactly as dnd shows it
    const reordered = arrayMove(flat, oldIndex, overIndex);
    setFlatTreeForScope(folderScope, reordered);

    // new index of dragged item in UI
    const newIndex = reordered.findIndex((f) => f.id === activeId);
    if (newIndex === -1) return;

    // folder visually ABOVE dragged item in the UI
    // const folderAbove = reordered[newIndex - 1] ?? null;
    const folderAboveRaw = reordered[newIndex - 1] ?? null;
    if (!folderAboveRaw || folderAboveRaw.type !== "folder") return;
    const folderAbove = folderAboveRaw;

    const aboveFolderId = folderAbove?.node.folder_id ?? null;
    const aboveId = folderAbove?.node.id ?? null;
    if (!aboveId || !aboveFolderId) return;

    let newParentId = undefined;
    let newOrdinal = undefined;

    if (aboveId === -1) {
      newParentId = null;
      newOrdinal = 0;
    } else if (
      // folder above is open AND has children
      currentOpenFolders.has(aboveFolderId) &&
      hasChildren(aboveId)
    ) {
      newParentId = aboveId;
      newOrdinal = 0;
    } else {
      newParentId = folderAbove.node.parent_folder_id;
      newOrdinal = folderAbove.node.ordinal + 1;
    }

    if (newParentId === undefined || newOrdinal === undefined) return;
    // prevent no-op (same parent + same ordinal)
    if (
      newParentId === (dragged.parent_folder_id ?? null) &&
      newOrdinal === dragged.ordinal
    ) {
      return;
    }

    console.log({
      type: "ABOVE_FOLDER",
      dragged_folder_id: dragged.folder_id,
      above_folder_id: folderAbove?.node.folder_id ?? null,
      above_folder_numeric_id: folderAbove?.node.id ?? null,
    });

    // moveProjectFolder({
    //   folder_id: dragged.folder_id,
    //   project_idx: currentProjectId,
    //   process_id: currentProcessId,
    //   scope: folderScope,
    //   name: dragged.name,
    //   parent_folder_id: newParentId,
    //   ordinal: newOrdinal,
    // } as FolderInput);
    resetDragUI();
  };

  // const onDragEnd = async (e: DragEndEvent) => {
  //   // const activeData = e.active.data.current;
  //   console.log("DRAG_END fired", {
  //     active: e.active?.id,
  //     over: e.over?.id,
  //   });

  //   const activeData = e.active.data.current;
  //   if (activeData?.kind !== "FOLDER") {
  //     console.log("NOT_FOLDER");
  //     return;
  //   }

  //   if (activeData?.kind !== "FOLDER") return;

  //   const tree = folderTreesByScope[folderScope];
  //   if (!tree) return;

  //   const folderId = activeData.folder.id;

  //   const result = computeDropTarget(e, tree, edgeHoverFolderId);

  //   if (!result) return;

  //   const { newParentId, newIndex } = result;
  //   if (newIndex == null) return;

  //   // ---- SNAPSHOT ----
  //   snapshotRef.current = tree;

  //   // ---- LOCAL MUTATION ----
  //   const updatedTree = moveFolderLocal(tree, folderId, newParentId, newIndex);

  //   console.log("LOCAL_MOVE", {
  //     folderId,
  //     newParentId,
  //     newIndex,
  //     before: tree.childrenByParent,
  //     after: updatedTree.childrenByParent,
  //   });

  //   setFolderTreeByScope(folderScope, updatedTree);

  //   if (!currentProjectId) return;
  //   console.log({
  //       folder_id: activeData.folder.folder_id,
  //       parent_folder_id: newParentId,
  //       ordinal: newIndex,
  //       scope: folderScope,
  //       process_id: currentProcessId,
  //       project_idx: currentProjectId,
  //       name: activeData.folder.name,
  //     })

  //   try {
  //     await moveProjectFolder({
  //       folder_id: activeData.folder.folder_id,
  //       parent_folder_id: newParentId,
  //       ordinal: newIndex,
  //       scope: folderScope,
  //       process_id: currentProcessId,
  //       project_idx: currentProjectId,
  //       name: activeData.folder.name,
  //     });
  //   } catch (err) {
  //     // ---- ROLLBACK ----
  //     if (snapshotRef.current) {
  //       setFolderTreeByScope(folderScope, snapshotRef.current);
  //     }
  //   }

  //   resetDragUI();
  // };

  const onDragCancel = () => {
    resetDragUI();
  };

  return {
    onDragStart,
    onDragEnd,
    onDragCancel,
  };
}
