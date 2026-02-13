// project/src/modules/_util/Folders/_hooks/folders.hooks.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import {
  EstimationFactDefinition,
  FolderScope,
  ProjectFolder,
} from "@open-dream/shared";
import { useContext, useEffect } from "react";
import { openFolder } from "../_actions/folders.actions";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  edgeHoverFolderRef,
  folderMoveBlockRef,
  ProjectFolderNode,
  resetDragUI,
  setFolderTreeByScope,
  useFoldersCurrentDataStore,
} from "../_store/folders.store";
import {
  buildNormalizedTree,
  closeFolderTreeBranch,
  flattenFromNormalizedTree,
  moveFolderLocal,
  treesEqual,
} from "../_helpers/folders.helpers";
import { arrayMove } from "@dnd-kit/sortable";
import { useEstimationProcesses } from "@/contexts/queryContext/queries/estimations/process/estimationProcess";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";

export type FolderScopeItemMap = {
  estimation_fact_definition: EstimationFactDefinition[];
  estimation_process: EstimationProcess[];
};

export function useFolderTreeItems(scope: FolderScope) {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const {} = useFoldersCurrentDataStore();
  const { estimationProcesses } = useEstimationProcesses(
    !!currentUser,
    currentProjectId,
  );
  const { factDefinitions } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
    currentProcessId,
  );

  const itemsByScope: Record<FolderScope, any[]> = {
    estimation_fact_definition: factDefinitions ?? [],
    estimation_process: estimationProcesses ?? [],
    estimation_variable: [],
    media: [],
  };

  return itemsByScope[scope] ?? [];
}

export function useSyncFolderTree(scope: FolderScope) {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const { projectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId,
    { scope, process_id: currentProcessId },
  );
  const treeItems = useFolderTreeItems(scope);
  const { draggingFolderId, setPendingServerSnapshot } =
    useFoldersCurrentDataStore();

  useEffect(() => {
    if (!projectFolders) return;
    const isBlocked = draggingFolderId || folderMoveBlockRef.current > 0;
    if (isBlocked) {
      setPendingServerSnapshot(projectFolders);
      return;
    }
    const newTree = buildNormalizedTree(projectFolders, treeItems);
    const currentTree =
      useFoldersCurrentDataStore.getState().folderTreesByScope[scope];
    if (treesEqual(currentTree, newTree)) {
      return;
    }
    setFolderTreeByScope(scope, newTree);
    setPendingServerSnapshot(null);
  }, [projectFolders, treeItems, draggingFolderId, scope]);
}

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
    currentOpenFolders,
    setEdgeHoverFolderId,
    pendingServerSnapshot,
    setPendingServerSnapshot,
  } = useFoldersCurrentDataStore();

  const folderScope: FolderScope = currentProcessId
    ? "estimation_fact_definition"
    : "estimation_process";
  const treeItems = useFolderTreeItems(folderScope);

  const { moveProjectFolder } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    {
      scope: folderScope,
      process_id: currentProcessId,
    },
  );

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
    if (hasChildren(data.folder.id)) {
      closeFolderTreeBranch(folderScope, data.folder.id);
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const DragEndFunction = async () => {
      const returnObject = {
        case: null as null | 1 | 2,
        message: null as null | string,
      };
      if (!currentProjectId) return { ...returnObject, message: "No Proj Id" };
      const activeData = e.active.data.current;
      if (activeData?.kind !== "FOLDER")
        return { ...returnObject, message: "Not a FOLDER" };

      const dragged = activeData.folder;

      const tree = folderTreesByScope[folderScope];
      if (!tree) return { ...returnObject, message: "tree was undefined" };

      const flat = flattenFromNormalizedTree(tree, currentOpenFolders);
      if (!flat.length)
        return { ...returnObject, message: "flat had no length" };

      const activeId = e.active.id;
      const overId = e.over?.id;

      // --------------------------------------------
      // CASE 1 — dropped ONTO folder (append)
      // --------------------------------------------
      const dropTargetId = edgeHoverFolderRef.current;

      if (dropTargetId && dropTargetId !== "__root__") {
        returnObject.case = 1;
        const targetFlat = flat.find(
          (f): f is Extract<typeof f, { type: "folder" }> =>
            f.type === "folder" &&
            String(f.node.folder_id) === String(dropTargetId),
        );

        if (!targetFlat)
          return { ...returnObject, message: "targetFlat was null" };

        const newParentId =
          targetFlat.node.id === -1 ? null : targetFlat.node.id;

        if (newParentId === dragged.id) {
          resetDragUI();
          return { ...returnObject, message: "Tried to assign parent as self" };
        }

        if (newParentId === dragged.parentId) {
          resetDragUI();
          return { ...returnObject, message: "Parent = old parent" };
        }

        // console.log({
        //   type: "MOVE_INTO_FOLDER_APPEND",
        //   dragged_folder_id: dragged.folder_id,
        //   old_parent_id: oldParentId,
        //   new_parent_id: newParentId,
        // });

        setEdgeHoverFolderId(null);

        const siblings = tree.childrenByParent[newParentId ?? "root"] ?? [];

        const optimisticTree = moveFolderLocal(
          tree,
          dragged.id,
          newParentId,
          siblings.length,
        );

        setFolderTreeByScope(folderScope, optimisticTree);

        moveProjectFolder({
          folder_id: dragged.folder_id,
          project_idx: currentProjectId,
          process_id: currentProcessId,
          scope: folderScope,
          parent_folder_id: newParentId,
          name: dragged.name,
          ordinal: null,
        });

        resetDragUI();
        return { ...returnObject, message: "Case 1 Success" };
      }

      // --------------------------------------------
      // CASE 2 — dropped BETWEEN (true reorder)
      // --------------------------------------------
      returnObject.case = 2;

      if (!overId) return { ...returnObject, message: "overId was null" };

      const oldIndex = flat.findIndex((f) => f.id === activeId);
      const overIndex = flat.findIndex((f) => f.id === overId);

      if (oldIndex === -1 || overIndex === -1)
        return {
          ...returnObject,
          message: "oldIndex === -1 || overIndex === -1",
        };

      const reordered = arrayMove(flat, oldIndex, overIndex);
      const newIndexInUI = reordered.findIndex((f) => f.id === activeId);

      if (newIndexInUI === -1)
        return { ...returnObject, message: "newIndexInUI === -1" };

      let folderAboveRaw: Extract<
        (typeof flat)[number],
        { type: "folder" }
      > | null = null;

      for (let i = newIndexInUI - 1; i >= 0; i--) {
        if (reordered[i].type === "folder") {
          folderAboveRaw = reordered[i] as any;
          break;
        }
      }

      let aboveFolderId: string;
      let aboveId: number;

      if (folderAboveRaw === null) {
        // top of list → root
        aboveFolderId = "__root__";
        aboveId = -1;
      } else {
        if (folderAboveRaw.type !== "folder")
          return { ...returnObject, message: "folderAboveRaw.type !== folder" };

        aboveFolderId = folderAboveRaw.node.folder_id;
        aboveId = folderAboveRaw.node.id;
      }

      let newParentId: number | null | undefined = undefined;
      let newOrdinal: number | undefined = undefined;

      if (hasChildren(aboveId) && currentOpenFolders.has(aboveFolderId)) {
        newParentId = aboveId;
      } else {
        if (folderAboveRaw) {
          newParentId = folderAboveRaw.parentId ?? null;
        } else {
          newParentId = null;
        }
      }

      // draggedFlat.parentId = newParentId;
      if (!folderAboveRaw) {
        newOrdinal = 0;
      } else if (
        hasChildren(aboveId) &&
        currentOpenFolders.has(aboveFolderId)
      ) {
        // inserting as first child inside open folder
        newOrdinal = 0;
      } else {
        const aboveOrdinal = folderAboveRaw.node.ordinal ?? 0;
        if (
          folderAboveRaw.parentId === dragged.parentId &&
          dragged.ordinal < folderAboveRaw.node.ordinal
        ) {
          newOrdinal = aboveOrdinal;
        } else {
          newOrdinal = aboveOrdinal + 1;
        }
      }

      if (newParentId === undefined || newOrdinal === undefined)
        return {
          ...returnObject,
          message: "newParentId === undefined || newOrdinal === undefined",
        };

      if (newParentId === dragged.id) {
        resetDragUI();
        return { ...returnObject, message: "Tried to assign parent as self" };
      }

      if (newParentId === dragged.parentId && newOrdinal === dragged.ordinal) {
        resetDragUI();
        if (pendingServerSnapshot) {
          const tree = buildNormalizedTree(pendingServerSnapshot, treeItems);
          setFolderTreeByScope(folderScope, tree);
          setPendingServerSnapshot(null);
        }
        return {
          ...returnObject,
          message: "No change -> Set tree to saved snapshot if available",
        };
      }

      // console.log({
      //   type: "ABOVE_FOLDER",
      //   dragged_folder_id: dragged.folder_id,
      //   above_folder_id: aboveFolderId,
      //   above_folder_numeric_id: aboveId,
      //   parent_folder_id: newParentId,
      //   ordinal: newOrdinal,
      // });

      const optimisticTree = moveFolderLocal(
        tree,
        dragged.id,
        newParentId,
        newOrdinal,
      );

      folderMoveBlockRef.current++;
      setFolderTreeByScope(folderScope, optimisticTree);

      // then call backend
      moveProjectFolder({
        folder_id: dragged.folder_id,
        project_idx: currentProjectId,
        process_id: currentProcessId,
        scope: folderScope,
        name: dragged.name,
        parent_folder_id: newParentId,
        ordinal: newOrdinal,
      }).finally(() => {
        folderMoveBlockRef.current--;
      });
      resetDragUI();
      return { ...returnObject, message: "Case 2 Success" };
    };

    const result = await DragEndFunction();
    console.log(result);
  };

  const onDragCancel = () => {
    resetDragUI();
  };

  return {
    onDragStart,
    onDragEnd,
    onDragCancel,
  };
}
