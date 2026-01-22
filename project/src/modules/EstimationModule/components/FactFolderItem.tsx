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
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { createFactFolderContextMenu } from "../_actions/estimations.actions";
import { EstimationFactFolder } from "@open-dream/shared";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput"; 

export default function FactFolderItem({
  node,
  depth,
  openFolders,
  toggleFolder,
  onDeleteFact,
}: {
  node: FactFolderNode;
  depth: number;
  openFolders: Set<string>;
  toggleFolder: (folder: any) => void;
  onDeleteFact: (id: string) => void;
}) {
  const { currentUser } = useContext(AuthContext);
  const theme = useCurrentTheme();
  const isOpen = openFolders.has(node.folder_id!);
  const { selectedFolderId, setSelectedFolderId } = useEstimationFactsUIStore();
  const { openContextMenu } = useContextMenuStore();
  const { currentProjectId } = useCurrentDataStore();
  const { modal2, setModal2 } = useUiStore();
  const { factFolders, upsertFactFolders } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId!,
  ); 

  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({
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

  return (
    <div
      data-draggable
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="mt-[4px]"
    >
      <div
        {...attributes}
        data-fact-folder-item
        className="flex items-center gap-2 px-2 rounded cursor-grab hover:brightness-90 dim"
        // {...attributes}
        // {...listeners}
        // className="flex items-center gap-2 px-2 py-1 rounded cursor-grab"
        style={{
          width: `calc(100% - ${alteredDepth * 10}px)`,
          marginLeft: `${alteredDepth * 10}px`,
          opacity: depth === 0 ? 0 : 1,
          height: depth === 0 ? 0 : 34,
          backgroundColor:
            selectedFolderId === node.id
              ? theme.background_2
              : theme.background_2_dim,
        }}
        onClick={() => {
          setSelectedFolderId(node.id);
          toggleFolder(node);
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
        <GripVertical size={14} />
        <Folder size={16} className="mt-[1px]" />
        <span className="truncate select-none">{node.name}</span>
      </div>

      {isOpen && (
        <div>
          <SortableContext
            items={[
              ...node.children.map((c) => `folder-${c.folder_id}`),
              ...node.facts.map((f) => `fact-${f.fact_id}`),
            ]}
            strategy={verticalListSortingStrategy}
          >
            {node.children.map((child) => (
              <FactFolderItem
                key={child.folder_id}
                node={child}
                depth={depth + 1}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
                onDeleteFact={onDeleteFact}
              />
            ))}

            {node.facts.map((fact) => (
              <div key={fact.fact_id}>
                <FactDraggableItem
                  fact={fact}
                  depth={depth + 1}
                  onDelete={() => onDeleteFact(fact.fact_id)}
                />
              </div>
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
