"use client";
import { useContext, useMemo, useRef } from "react";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { buildFactFolderTree } from "../_helpers/estimations.helpers";
import FactFolderItem from "./FactFolderItem";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { resetUIStore, useUiStore } from "@/store/useUIStore";
import { FaPlus } from "react-icons/fa6";
import { Folder } from "lucide-react";
import { resetVariableUI, useEstimationFactsUIStore } from "../_store/estimations.store";
import { EstimationFactFolder, VariableScope } from "@open-dream/shared";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { displayToKey } from "@/util/functions/Data";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { openFactFolder } from "../_actions/estimations.actions";
import FactDraggableItem from "./FactDraggableItem";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";
import { LuPanelLeftClose } from "react-icons/lu";

export default function EstimationsLeftBar() {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId, currentProcessRunId } =
    useCurrentDataStore();
  const {
    factDefinitions,
    factFolders,
    upsertFactDefinition,
    upsertFactFolders,
    deleteFactDefinition,
  } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
    currentProcessId,
  );
  const { modal2, setModal2 } = useUiStore();
  const {
    selectedFolderId,
    setSelectedFolderId,
    openFolders,
    variableView,
    setVariableView,
    setEditingFact,
    selectingVariableReturn,
    runInputsOpen,
    setRunInputsOpen,
  } = useEstimationFactsUIStore();

  // const { variables } = useEstimationIfTrees(!!currentUser, currentProjectId);
  // const availableVariables = Array.isArray(variables)
  //   ? variables.map((v: any) => v.var_key)
  //   : (variables.variables?.map((v: any) => v.var_key) ?? []);

  const scopedFacts = useMemo(() => {
    return factDefinitions.filter((f) => f.variable_scope === variableView);
  }, [factDefinitions, variableView]);

  const tree = useMemo(() => {
    const treeResult = buildFactFolderTree(factFolders, scopedFacts);
    return treeResult;
  }, [factFolders, scopedFacts]);

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
                process_id: currentProcessId,
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

  const handleAddVariable = () => {
    const EditVariableSteps: StepConfig[] =
      variableView === "fact"
        ? [
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
          ]
        : [
            {
              name: "name",
              placeholder: `Variable Name...`,
              validate: (val) => (val.length >= 1 ? true : "1+ chars"),
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
          : "number";

      await upsertFactDefinition({
        fact_key,
        fact_type: variableView === "fact" ? fact_type : "number",
        variable_scope: variableView,
        description: null,
        folder_id: selectedFolderId,
        process_id: currentProcessId!,
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
          steps={EditVariableSteps}
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

  const handleFolderTypeClick = (type: VariableScope) => {
    setEditingFact(null);
    setVariableView(type);
  };

  return (
    <div
      data-no-pan
      className="relative w-full h-[100%] flex flex-col"
      style={{
        backgroundColor: currentTheme.background_1,
        borderRight: "0.5px solid " + currentTheme.background_2,
      }}
    >
      {currentProcessRunId !== null && (
        <div>
          {runInputsOpen ? (
            <div
              style={{
                borderLeft: "0.5px solid " + currentTheme.background_2,
                borderRight: "0.5px solid " + currentTheme.background_2,
                backgroundColor: currentTheme.background_1,
              }}
              className="w-[120px] h-[100%] left-[100%] absolute top-0 z-500"
            >
              <LuPanelLeftClose
                style={{ color: currentTheme.text_4 }}
                className="mt-[15px] ml-[85px] dim cursor-pointer brightness-75 hover:brightness-50 w-[22px] h-[22px]"
                onClick={() => {
                  setRunInputsOpen(false);
                }}
              />
            </div>
          ) : (
            <div
              className="absolute z-500 top-[13px] left-[100%] w-[30px] h-[34px] flex justify-center items-center  hover:brightness-80 cursor-pointer dim"
              style={{
                backgroundColor: currentTheme.background_1,
                border: "0.5px solid " + currentTheme.background_2,
              }}
              onClick={() => {
                setRunInputsOpen(true);
                resetVariableUI()
              }}
            >
              <LuPanelLeftClose
                style={{ color: currentTheme.text_4 }}
                className="rotate-180 brightness-75 w-[22px] h-[22px]"
              />
            </div>
          )}
        </div>
      )}
      {selectingVariableReturn === null ||
      selectingVariableReturn.type !== "variable" ? (
        <div
          data-folders-top={-1}
          className={
            "px-[15px] flex flex-row items-center justify-between pt-[12px] pb-[2px] h-[55px]"
          }
        >
          <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
            <p className="select-none w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
              Variables
            </p>
          </div>

          <div className="flex flex-row gap-[7px] items-center">
            {variableView === "fact" && (
              <div
                data-fact-button
                onClick={handleAddFolder}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_3,
                }}
              >
                <Folder size={13} />
              </div>
            )}

            <div
              data-fact-button
              onClick={handleAddVariable}
              className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: currentTheme.background_1_3,
              }}
            >
              <FaPlus size={12} />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[55px] w-[100%] justify-center items-center flex pt-[4px]">
          <p className="font-[600] h-[40px] truncate text-[23px] leading-[30px] mt-[6px]">
            Select Variable
          </p>
        </div>
      )}

      <div className="select-none w-[100%] flex flex-row gap-[7px] justify-center pb-[8px] mb-[0px] px-3 text-[12px] font-[400]">
        <div
          onClick={() => handleFolderTypeClick("fact")}
          style={{
            backgroundColor:
              variableView === "fact"
                ? nodeColors["fact"]
                : currentTheme.background_3,
          }}
          className={`${variableView !== "fact" && "brightness-55 hover:brightness-60"} w-[100%] rounded-[5px] cursor-pointer dim text-center py-[3px]`}
        >
          Form
        </div>
        <div
          style={{
            backgroundColor:
              variableView === "geometric"
                ? nodeColors["geometric"]
                : currentTheme.background_3,
          }}
          onClick={() => handleFolderTypeClick("geometric")}
          className={`${variableView !== "geometric" && "brightness-55 hover:brightness-60"} w-[100%] rounded-[5px] px-[9px] cursor-pointer dim text-center py-[3px]`}
        >
          Geometric
        </div>
        <div
          style={{
            backgroundColor:
              variableView === "project"
                ? nodeColors["project"]
                : currentTheme.background_3,
          }}
          onClick={() => handleFolderTypeClick("project")}
          className={`${variableView !== "project" && "brightness-55 hover:brightness-60"} w-[100%] rounded-[5px] cursor-pointer dim text-center py-[3px]`}
        >
          Project
        </div>
      </div>

      {variableView === "fact" && (
        <div
          ref={containerRef}
          className={`px-3 flex-1 overflow-y-auto ${currentProcessRunId !== null && runInputsOpen ? "w-[calc(100%+120px)]" : "w-[100%]"}`}
        >
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
      )}

      {variableView !== "fact" && (
        <div className="px-3 flex-1 overflow-y-auto pb-[15px]">
          {scopedFacts.map((fact) => (
            <FactDraggableItem key={fact.fact_id} fact={fact} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
