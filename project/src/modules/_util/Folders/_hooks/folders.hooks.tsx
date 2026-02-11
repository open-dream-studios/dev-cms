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
import { useContext, useMemo } from "react";
import { openFolder } from "../_actions/folders.actions";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  ProjectFolderNode,
  useFoldersCurrentDataStore,
} from "../_store/folders.store";
import {
  buildFolderTree,
  collectDescendantFolderIds,
} from "../_helpers/folders.helpers";
import { useEstimationProcesses } from "@/contexts/queryContext/queries/estimations/process/estimationProcess";
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
  const { selectedFolder } = useFoldersCurrentDataStore();

  const handleAddFolder = async () => {
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
            await upsertProjectFolders([
              {
                folder_id: null,
                scope,
                parent_folder_id:
                  selectedFolder && selectedFolder.scope === scope
                    ? (selectedFolder?.id ?? null)
                    : null,
                name: values.name,
                ordinal: null,
                process_id: currentProcessId,
              },
            ]);
            if (selectedFolder && selectedFolder.id) {
              const matchedFolder = projectFolders.find(
                (folder: ProjectFolder) => folder.id === selectedFolder.id,
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
  const { setDraggingFolderId, setDraggingFolderDepth } =
    useFoldersCurrentDataStore();
  const { flatFolderTreeRef, currentOpenFolders } =
    useFoldersCurrentDataStore();

  const folderScope: FolderScope = currentProcessId
    ? "estimation_fact_definition"
    : "estimation_process";
  const { projectFolders, moveProjectFolder } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    {
      scope: folderScope,
      process_id: currentProcessId,
    },
  );
  const { estimationProcesses } = useEstimationProcesses(
    !!currentUser,
    currentProjectId,
  );

  const { edgeHoverFolderId, setEdgeHoverFolderId } =
    useFoldersCurrentDataStore();

  const folderNodeById = useMemo(() => {
    const tree = buildFolderTree(
      projectFolders,
      estimationProcesses,
      folderScope,
    );
    const map = new Map<number, ProjectFolderNode>();
    const walk = (node: ProjectFolderNode) => {
      map.set(node.id, node);
      node.children.forEach(walk);
    };
    tree.forEach(walk);
    return map;
  }, [projectFolders, estimationProcesses, folderScope]);

  const hasChildren = (folderNumericId: number) => {
    const node = folderNodeById.get(folderNumericId);
    return !!node && node.children.length > 0;
  };

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    if (data?.kind !== "FOLDER") return;
    const node = folderNodeById.get(data.folder.id);
    if (!node) return;
    setDraggingFolderId(data.folder.folder_id);
    setDraggingFolderDepth(data.depth);
    useFoldersCurrentDataStore.getState().set((state) => {
      const next = new Set(state.currentOpenFolders);
      next.delete(data.folder.folder_id);
      const descendantIds = collectDescendantFolderIds(node);
      descendantIds.forEach((id) => next.delete(id));
      return { currentOpenFolders: next };
    });
    setEdgeHoverFolderId(null);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const activeData = e.active.data.current;
    if (activeData?.kind !== "FOLDER") return;

    const dragged = activeData.folder;
    const oldParentId = dragged.parent_folder_id ?? null;

    // --------------------------------------------
    // CASE 1 — dropped ONTO folder (white border)
    // --------------------------------------------
    if (edgeHoverFolderId) {
      const flat = flatFolderTreeRef.current;
      if (!flat) return;

      const targetFlat = flat.find(
        (f) => String(f.node.folder_id) === String(edgeHoverFolderId),
      );

      if (!targetFlat) return;

      const newParentId = targetFlat.node.id === -1 ? null : targetFlat.node.id;

      console.log({
        type: "MOVE_INTO_FOLDER_APPEND",
        dragged_folder_id: dragged.folder_id,
        old_parent_id: oldParentId,
        new_parent_id: newParentId,
      });

      useFoldersCurrentDataStore.getState().set({
        edgeHoverFolderId: null,
      });

      await moveProjectFolder({
        folder_id: dragged.folder_id,
        project_idx: currentProjectId,
        process_id: currentProcessId,
        scope: folderScope,
        parent_folder_id: newParentId,
        name: dragged.name,
        ordinal: null,
      } as FolderInput);
      return;
    }

    // --------------------------------------------
    // CASE 2 — dropped BETWEEN (true reorder)
    // --------------------------------------------
    const flat = flatFolderTreeRef.current;
    if (!flat?.length) return;

    const activeId = e.active.id;
    const overId = e.over?.id;
    if (!overId) return;

    const oldIndex = flat.findIndex((f) => f.id === activeId);
    const overIndex = flat.findIndex((f) => f.id === overId);

    if (oldIndex === -1 || overIndex === -1) return;

    // simulate final UI order exactly as dnd shows it
    const reordered = arrayMove(flat, oldIndex, overIndex);

    // new index of dragged item in UI
    const newIndex = reordered.findIndex((f) => f.id === activeId);
    if (newIndex === -1) return;

    // folder visually ABOVE dragged item in the UI
    const folderAbove = reordered[newIndex - 1] ?? null;

    console.log({
      type: "ABOVE_FOLDER",
      dragged_folder_id: dragged.folder_id,
      above_folder_id: folderAbove?.node.folder_id ?? null,
      above_folder_numeric_id: folderAbove?.node.id ?? null,
    });

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

    if (!newParentId || !newOrdinal) return;

    await moveProjectFolder({
      folder_id: dragged.folder_id,
      project_idx: currentProjectId,
      process_id: currentProcessId,
      scope: folderScope,
      name: dragged.name,
      parent_folder_id: newParentId,
      ordinal: newOrdinal,
    } as FolderInput);
  };

  const onDragCancel = () => {
    setEdgeHoverFolderId(null);
    setDraggingFolderId(null);
  };

  return {
    onDragStart,
    onDragEnd,
    onDragCancel,
  };
}
