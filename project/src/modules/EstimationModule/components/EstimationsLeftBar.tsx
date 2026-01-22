"use client";
import { useContext, useMemo, useRef, useState } from "react";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { buildFactFolderTree } from "../_helpers/estimations.helpers";
import FactFolderItem from "./FactFolderItem";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useUiStore } from "@/store/useUIStore";
import { FaPlus } from "react-icons/fa6";
import { Folder } from "lucide-react";
import { useEstimationFactsUIStore } from "../_store/estimations.store";
import { EstimationFactFolder } from "@open-dream/shared";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { displayToKey } from "@/util/functions/Data";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { openFactFolder, toggleFactFolder } from "../_actions/estimations.actions";

export default function EstimationsLeftBar() {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const {
    factDefinitions,
    factFolders,
    upsertFactDefinition,
    upsertFactFolders,
    deleteFactDefinition,
  } = useEstimationFactDefinitions(!!currentUser, currentProjectId);
  const { modal2, setModal2 } = useUiStore();
  const {
    selectedFolderId,
    setSelectedFolderId,
    openFolders, 
  } = useEstimationFactsUIStore();

  const tree = useMemo(() => {
    const newTree = buildFactFolderTree(factFolders, factDefinitions);
    console.log(newTree);
    return newTree;
  }, [factFolders, factDefinitions]);

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
            await upsertFactFolders([
              {
                folder_id: null,
                parent_folder_id: selectedFolderId,
                name: values.name,
                ordinal: null,
                process_id: 1,
              },
            ]);
            if (selectedFolderId) {
              const selectedFolder = factFolders.find(
                (folder: EstimationFactFolder) =>
                  folder.id === selectedFolderId,
              );
              if (selectedFolder) {
                openFactFolder(selectedFolder);
              }
            }
          }}
        />
      ),
    });
  };

  const handleAddFactDefinition = () => {
    const EditFactSteps: StepConfig[] = [
      {
        name: "name",
        placeholder: `Fact Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
      {
        name: "type",
        placeholder: `Fact Type...`,
        validate: (val) => {
          return true;
        },
      },
    ];

    const onComplete = async (values: any) => {
      const fact_key = displayToKey(values.name);
      if (!fact_key) return;

      const raw = values.type;
      const fact_type =
        raw === "boolean" ||
        raw === "number" ||
        raw === "string" ||
        raw === "enum"
          ? raw
          : "string";

      await upsertFactDefinition({
        fact_key,
        fact_type: fact_type,
        description: null,
        folder_id: selectedFolderId,
        process_id: 1,
      });
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
          key={`edit-fact-${Date.now()}`}
          steps={EditFactSteps}
          onComplete={onComplete}
        />
      ),
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, (e: React.PointerEvent) => {
    const el = e.target as HTMLElement;
    if (
      el.closest("[data-fact-folder-item]") ||
      el.closest("[data-fact-button]") ||
      el.closest("[data-modal]")
    ) {
      return;
    }
    setSelectedFolderId(null);
  });

  return (
    <div
      data-no-pan
      className="w-full h-full overflow-auto"
      style={{
        backgroundColor: currentTheme.background_1,
        borderRight: "0.5px solid " + currentTheme.background_2,
      }}
    >
      <div
        data-folders-top={-1}
        className={
          "px-[15px] flex flex-row items-center justify-between pt-[12px] pb-[6px] h-[60px]"
        }
      >
        <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
          <p className="cursor-pointer hover:opacity-[75%] transition-all duration-300 ease-in-out w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
            Form Data
          </p>
        </div>

        <div className="flex flex-row gap-[7px] items-center">
          <div
            data-fact-button
            onClick={handleAddFolder}
            className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
            style={{
              backgroundColor: currentTheme.background_1_2,
            }}
          >
            <Folder size={13} />
          </div>

          <div
            data-fact-button
            onClick={handleAddFactDefinition}
            className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
            style={{
              backgroundColor: currentTheme.background_1_2,
            }}
          >
            <FaPlus size={12} />
          </div>
        </div>
      </div>
      <div ref={containerRef} className="px-3 mt-[-8px]  space-y-1">
        {tree.map((node) => (
          <SortableContext
            key={node.folder_id}
            items={node.children.map((f) => `folder-${f.folder_id}`)}
            strategy={verticalListSortingStrategy}
          >
            <FactFolderItem
              node={node}
              depth={0}
              openFolders={openFolders}
              onDeleteFact={deleteFactDefinition}
            />
          </SortableContext>
        ))}
      </div>
    </div>
  );
}
