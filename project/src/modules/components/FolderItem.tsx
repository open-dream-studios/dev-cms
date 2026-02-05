// src/modules/components/FolderItem.tsx
"use client";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { ChevronRight, ChevronDown, Folder, GripVertical } from "lucide-react";
import FactDraggableItem from "../EstimationModule/components/FactDraggableItem";
import { useEstimationFactsUIStore } from "../EstimationModule/_store/estimations.store";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import {
  EstimationFactDefinition,
  FolderScope,
  ProjectFolder,
} from "@open-dream/shared";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useDndContext } from "@dnd-kit/core";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import {
  createFolderContextMenu,
  toggleFolder,
} from "@/modules/_actions/folders.actions";
import {
  ProjectFolderNode,
  ProjectFolderNodeItem,
} from "@/modules/_helpers/folders.helpers";
import { EstimationProcessItem } from "../EstimationModule/components/EstimationsLeftBar";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import ProcessDraggableItem from "../EstimationModule/components/ProcessDraggableItem";

export default function FolderItem({
  node,
  depth,
  scope,
}: {
  node: ProjectFolderNode;
  depth: number;
  scope: FolderScope;
}) {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { openContextMenu } = useContextMenuStore();
  const {
    selectedFolder,
    setSelectedFolder,
    currentOpenFolders,
    currentProjectId,
    currentProcessId,
    currentProcessRunId,
    draggingFolderId,
  } = useCurrentDataStore();
  const { modal2, setModal2 } = useUiStore();

  const { runInputsOpen } = useEstimationFactsUIStore();
  const isEstimationAndInputsOpen =
    scope === "estimation_fact_definition" &&
    runInputsOpen &&
    currentProcessRunId !== null;

  const isOpen = currentOpenFolders.has(node.folder_id!);

  const { projectFolders, upsertProjectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    {
      scope,
      process_id: currentProcessId,
    },
  );

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: `folder-${node.folder_id}`,
    data: { kind: "FOLDER", folder: node },
  });

  const alteredDepth = Math.max(depth - 1, 0);

  const handleEditFolder = () => {
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

  const isDraggingThis = draggingFolderId === node.folder_id;

  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
  };

  const { active } = useDndContext();
  const isDraggingOverFolder =
    active?.data.current?.kind.startsWith("FOLDER-ITEM") ||
    active?.data.current?.kind === "FOLDER";

  return (
    <div
      data-draggable
      ref={setRefs}
      className={`rounded-[5px] mb-[4px] ${isEstimationAndInputsOpen ? "w-[calc(100%-57.5px)]" : "w-[100%]"}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        outline:
          isOver && isDraggingOverFolder
            ? `1px solid ${currentTheme.text_4}`
            : undefined,
      }}
    >
      <div
        {...attributes}
        data-fact-folder-item
        className="flex items-center gap-2 px-2 rounded-[5px] cursor-grab hover:brightness-90 dim"
        style={{
          width: `calc(100% - ${alteredDepth * 10}px)`,
          marginLeft: `${alteredDepth * 10}px`,
          opacity: depth === 0 ? 0 : 1,
          height: depth === 0 ? 0 : 34,
          pointerEvents: depth === 0 ? "none" : "all",
          backgroundColor:
            selectedFolder && selectedFolder.id === node.id
              ? currentTheme.background_2
              : currentTheme.background_2_dim,
        }}
        onClick={() => {
          setSelectedFolder({
            scope,
            id: node.id,
          });
          toggleFolder(node);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu({
            position: { x: e.clientX, y: e.clientY },
            target: node,
            menu: createFolderContextMenu(handleEditFolder),
          });
        }}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <GripVertical {...listeners} size={14} />
        <Folder size={16} className="mt-[1px]" />
        <span className="truncate select-none">{node.name}</span>
      </div>

      {isOpen && !isDraggingThis && (
        <div className="mt-[4px]">
          <SortableContext
            items={node.children.map((c) => `folder-${c.folder_id}`)}
            strategy={verticalListSortingStrategy}
          >
            {node.children.map((child) => (
              <FolderItem
                key={child.folder_id}
                node={child}
                depth={depth + 1}
                scope={scope}
              />
            ))}
          </SortableContext>

          {node.items.map((item: ProjectFolderNodeItem, index: number) => (
            <div
              key={item.id}
              className="z-501 relative"
              style={{
                width: `calc(100% - ${depth * 10}px)`,
                marginLeft: `${depth * 10}px`,
              }}
            >
              {scope === "estimation_fact_definition" && (
                <FactDraggableItem fact={item as EstimationFactDefinition} />
              )}
              {scope === "estimation_process" && (
                <ProcessDraggableItem
                  key={index}
                  estimationProcess={item as EstimationProcess}
                  index={index}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
