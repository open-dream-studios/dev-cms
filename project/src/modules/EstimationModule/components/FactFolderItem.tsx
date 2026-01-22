// src/modules/EstimationModule/components/FactFolderItem.tsx
"use client";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FactFolderNode } from "../_helpers/estimations.helpers";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { ChevronRight, ChevronDown, Folder, GripVertical } from "lucide-react";
import FactDraggableItem from "./FactDraggableItem";
import { useEstimationFactsUIStore } from "../_store/estimations.store";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import {
  createFactFolderContextMenu,
  toggleFactFolder,
} from "../_actions/estimations.actions";
import { EstimationFactFolder } from "@open-dream/shared";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useDndContext } from "@dnd-kit/core";

export default function FactFolderItem({
  node,
  depth,
  openFolders,
  onDeleteFact,
}: {
  node: FactFolderNode;
  depth: number;
  openFolders: Set<string>;
  onDeleteFact: (id: string) => void;
}) {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const isOpen = openFolders.has(node.folder_id!);
  const { selectedFolderId, setSelectedFolderId } = useEstimationFactsUIStore();
  const { openContextMenu } = useContextMenuStore();
  const { currentProjectId } = useCurrentDataStore();
  const { modal2, setModal2 } = useUiStore();
  const { factFolders, upsertFactFolders } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId!,
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
    const matchedFactFolder = factFolders.find(
      (folder: EstimationFactFolder) => folder.folder_id === node.folder_id,
    );
    if (!matchedFactFolder) return;
    const EditFolderSteps: StepConfig[] = [
      {
        name: "name",
        initialValue: matchedFactFolder.name ?? "",
        placeholder: `Folder Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
    ];

    const onComplete = async (values: any) => {
      await upsertFactFolders([
        {
          ...matchedFactFolder,
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

  const draggingFolderId = useEstimationFactsUIStore((s) => s.draggingFolderId);
  const isDraggingThis = draggingFolderId === node.folder_id;

  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
  };

  const { active } = useDndContext();
  const isDraggingOverFolder =
    active?.data.current?.kind === "FACT" ||
    active?.data.current?.kind === "FOLDER";

  return (
    <div
      data-draggable
      ref={setRefs}
      className="rounded-[5px] mt-[4px]"
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
          backgroundColor:
            selectedFolderId === node.id
              ? currentTheme.background_2
              : currentTheme.background_2_dim,
        }}
        onClick={() => {
          setSelectedFolderId(node.id);
          toggleFactFolder(node);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu({
            position: { x: e.clientX, y: e.clientY },
            target: node,
            menu: createFactFolderContextMenu(handleEditFolder),
          });
        }}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <GripVertical {...listeners} size={14} />
        <Folder size={16} className="mt-[1px]" />
        <span className="truncate select-none">{node.name}</span>
      </div>

      {isOpen && !isDraggingThis && (
        <div>
          <SortableContext
            items={node.children.map((c) => `folder-${c.folder_id}`)}
            strategy={verticalListSortingStrategy}
          >
            {node.children.map((child) => (
              <FactFolderItem
                key={child.folder_id}
                node={child}
                depth={depth + 1}
                openFolders={openFolders}
                onDeleteFact={onDeleteFact}
              />
            ))}
          </SortableContext>
          {node.facts.map((fact) => (
            <div key={fact.fact_id}>
              <FactDraggableItem
                fact={fact}
                depth={depth + 1}
                onDelete={() => onDeleteFact(fact.fact_id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
