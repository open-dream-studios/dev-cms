"use client";
import { useContext, useEffect, useMemo, useState } from "react";
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
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DragOverlay } from "@dnd-kit/core";
import { Folder, GripVertical } from "lucide-react";
import { useEstimationFactsUIStore } from "../_store/estimations.store";
import { EstimationFactDefinition } from "@open-dream/shared";

export default function EstimationsLeftBar() {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { upsertFactDefinition } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const {
    factDefinitions,
    factFolders,
    upsertFactFolders,
    deleteFactDefinition,
  } = useEstimationFactDefinitions(!!currentUser, currentProjectId);
  const { modal2, setModal2 } = useUiStore();

  const ROOT_ID = "__root__";
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    () => new Set([ROOT_ID]),
  );
  const { selectedFolderId, setSelectedFolderId } = useEstimationFactsUIStore();

  const tree = useMemo(() => {
    const newTree = buildFactFolderTree(factFolders, factDefinitions);
    console.log(newTree);
    return newTree;
  }, [factFolders, factDefinitions]);

  const toggleFolder = (folder: any) => {
    const id = folder.folder_id;
    setSelectedFolderId(folder.id);
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!activeId) return;
  }, [activeId]);

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
            // const newIds = await upsertMediaFolders([
            //   {
            //     folder_id: null,
            //     project_idx: currentProjectId,
            //     parent_folder_id: currentActiveFolder
            //       ? currentActiveFolder.id
            //       : null,
            //     name: values.name,
            //     ordinal: null,
            //   } as MediaFolder,
            // ]);

            // if (newIds && newIds.length) {
            //   if (currentActiveFolder && currentActiveFolder.id) {
            //     setCurrentOpenFolders((prev) =>
            //       new Set(prev).add(currentActiveFolder.id!),
            //     );
            //   }
            //   newlyAddedFolderRef.current = newIds[0];
            // }

            await upsertFactFolders([
              {
                folder_id: null,
                parent_folder_id: selectedFolderId,
                name: values.name,
                ordinal: null,
              },
            ]);
          }}
        />
      ),
    });
  };

  const handleAddFactDefinition = (fact: EstimationFactDefinition) => {
    const EditFactSteps: StepConfig[] = [
      {
        name: "name",
        initialValue: fact.fact_key ?? "",
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
      const fact_key = values.name.trim();
      if (!fact_key) return;

      const raw = (prompt("fact_type? boolean|number|string|enum") || "string")
        .trim()
        .toLowerCase();

      const fact_type =
        raw === "boolean" ||
        raw === "number" ||
        raw === "string" ||
        raw === "enum"
          ? raw
          : "string";

      await upsertFactDefinition({
        fact_key,
        fact_type: fact_type as any,
        description: null,
        folder_id: selectedFolderId,
        process_id: "1",
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

        <div
          onClick={handleAddFolder}
          className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
          style={{
            backgroundColor: currentTheme.background_1_2,
          }}
        >
          <FaPlus size={12} />
        </div>
      </div>
      <div className="px-3 mt-[-8px]  space-y-1">
        <SortableContext
          items={tree.map((n) => `folder-${n.folder_id}`)}
          strategy={verticalListSortingStrategy}
        >
          {tree.map((node) => (
            <FactFolderItem
              key={node.folder_id}
              node={node}
              depth={0}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              onDeleteFact={deleteFactDefinition}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeId?.startsWith("folder-") && (
          <div
            className="flex items-center gap-2 px-2 py-1 rounded shadow"
            style={{ backgroundColor: currentTheme.background_2 }}
          >
            <GripVertical size={14} />
            <Folder size={16} />
            <span>Folder</span>
          </div>
        )}
      </DragOverlay>
    </div>
  );
}
