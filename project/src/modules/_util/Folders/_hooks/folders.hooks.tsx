// project/src/modules/_util/Folders/_hooks/folders.hooks.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { FolderScope, ProjectFolder } from "@open-dream/shared";
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
// import { arrayMove } from "@dnd-kit/sortable";

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

type Args = {
  projectFolders: ProjectFolder[];
  currentProjectId: number | null;
  scope: FolderScope;
  process_id: number | null;
  reorderProjectFolders: (args: {
    process_id: number | null;
    parent_folder_id: number | null;
    orderedIds: string[];
  }) => Promise<any>;
};

export function useFolderDndHandlers(
  {
    // projectFolders,
    // currentProjectId,
    // scope,
    // process_id,
    // reorderProjectFolders,
  }: Args,
) {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const { setDraggingFolderId, setDraggingFolderDepth } =
    useFoldersCurrentDataStore();

  const folderScope: FolderScope = currentProcessId
    ? "estimation_fact_definition"
    : "estimation_process";
  const { projectFolders } = useProjectFolders(
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
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const activeData = e.active.data.current;
    const overData = e.over?.data.current;

    if (activeData?.kind === "FOLDER" && overData?.kind === "FOLDER") {
      const dragged = activeData.folder;
      const target = overData.folder;

      if (dragged.folder_id === target.folder_id) return;

      const parentId =
        target.id === -1 || target.folder_id === null ? null : target.id; // 👈 MUST be numeric id or null

      console.log("upserting");
      console.log(dragged, target);
      console.log(activeData, target);
      // await upsertProjectFolders([
      //   {
      //     folder_id: dragged.folder_id,
      //     name: dragged.name,
      //     scope: folderScope,
      //     process_id: dragged.process_id ?? null,
      //     parent_folder_id: parentId,
      //     ordinal: null,
      //   },
      // ]);
      // if (parentId !== null) {
      //   openFolder(target);
      // }
    }

    // const { active, over } = event;
    // setDraggingFolderId(null);
    // if (!over || active.id === over.id) return;
    // const activeId = String(active.id).replace("folder-", "");
    // const overId = String(over.id).replace("folder-", "");
    // const draggedFolder = projectFolders.find((f) => f.folder_id === activeId);
    // if (!draggedFolder) return;
    // const parentFolderId = draggedFolder.parent_folder_id ?? null;
    // const siblings = projectFolders
    //   .filter((f) => f.parent_folder_id === parentFolderId)
    //   .sort((a, b) => a.ordinal - b.ordinal);
    // const oldIndex = siblings.findIndex((f) => f.folder_id === activeId);
    // const newIndex = siblings.findIndex((f) => f.folder_id === overId);
    // if (oldIndex === -1 || newIndex === -1) return;
    // const reordered = arrayMove(siblings, oldIndex, newIndex);
    // 🔥 optimistic cache update
    // queryClient.setQueryData(
    //   ["projectFolders", currentProjectId, scope, process_id],
    //   (prev: ProjectFolder[] | undefined) => {
    //     if (!prev) return prev;
    //     return prev.map((f) => {
    //       const idx = reordered.findIndex((r) => r.id === f.id);
    //       return idx === -1 ? f : { ...f, ordinal: idx };
    //     });
    //   }
    // );
    // 🔥 backend reorder
    // await reorderProjectFolders({
    //   process_id: draggedFolder.process_id ?? null,
    //   parent_folder_id: parentFolderId,
    //   orderedIds: reordered.map((f) => f.folder_id),
    // });
  };

  const onDragCancel = () => {
    // setDraggingFolderId(null);
  };

  return {
    onDragStart,
    onDragEnd,
    onDragCancel,
  };
}
