"use client";
import { useContext, useMemo, useRef } from "react";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useUiStore } from "@/store/useUIStore";
import { FaPlus } from "react-icons/fa6";
import { ChevronLeft, ChevronRight, Folder, GripVertical } from "lucide-react";
import {
  resetVariableUI,
  useEstimationFactsUIStore,
} from "../_store/estimations.store";
import {
  EstimationFactDefinition,
  FolderScope,
  ProjectFolder,
  VariableScope,
} from "@open-dream/shared";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { displayToKey } from "@/util/functions/Data";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import FactDraggableItem from "./FactDraggableItem";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";
import { LuPanelLeftClose } from "react-icons/lu";
import { useEstimationProcesses } from "@/contexts/queryContext/queries/estimations/process/estimationProcess";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import { openFolder } from "@/modules/_actions/folders.actions";
import FolderItem from "../../components/FolderItem";
import {
  buildFolderTree,
  ProjectFolderNodeItem,
} from "@/modules/_helpers/folders.helpers";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import { createEstimationProcessContextMenu } from "../_helpers/estimations.helpers";

export const EstimationProcessItem = ({
  estimationProcess,
  index,
}: {
  estimationProcess: EstimationProcess;
  index: number;
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { openContextMenu } = useContextMenuStore();
  const { currentProjectId, setCurrentProcessId } = useCurrentDataStore();
  const { estimationProcesses, upsertEstimationProcess } =
    useEstimationProcesses(!!currentUser, currentProjectId);

  const { modal2, setModal2 } = useUiStore();

  const handleEditEstimationProcess = (clickedProcess: EstimationProcess) => {
    const matchedProcess = estimationProcesses.find(
      (process: EstimationProcess) =>
        process.process_id === clickedProcess.process_id,
    );
    if (!matchedProcess) return;
    const EditProcessSteps: StepConfig[] = [
      {
        name: "label",
        initialValue: matchedProcess.label ?? "",
        placeholder: `Process Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
    ];

    const onComplete = async (values: any) => {
      await upsertEstimationProcess({
        ...matchedProcess,
        label: values.label,
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
          key={`edit-process-${Date.now()}`}
          steps={EditProcessSteps}
          onComplete={onComplete}
        />
      ),
    });
  };

  return (
    <div
      className="w-[100%] h-[34px] mb-[4px] flex justify-between items-center gap-2 pr-[8px] pl-[11px] rounded-[5px] cursor-grab hover:brightness-90 dim"
      style={{
        borderLeft: "1.5px solid " + nodeColors["fact"],
        backgroundColor: currentTheme.background_2_dim,
      }}
      onClick={() => {
        setCurrentProcessId(estimationProcess.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: estimationProcess,
          menu: createEstimationProcessContextMenu(handleEditEstimationProcess),
        });
      }}
    >
      <div className="h-[100%] flex flex-row gap-[8px] items-center">
      <GripVertical size={14} />
      <span className="truncate select-none font-[500] opacity-90">
        {estimationProcess.label
          ? estimationProcess.label
          : "Process " + (index + 1)}
      </span>
      </div>
      <ChevronRight size={14} />
    </div>
  );
};

export default function EstimationsLeftBar() {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const {
    currentProjectId,
    currentProcessId,
    setCurrentProcessId,
    currentProcessRunId,
    selectedFolder,
    setSelectedFolder,
  } = useCurrentDataStore();
  const { factDefinitions, upsertFactDefinition } =
    useEstimationFactDefinitions(
      !!currentUser,
      currentProjectId,
      currentProcessId,
    );
  const { modal2, setModal2 } = useUiStore();
  const {
    variableView,
    setVariableView,
    setEditingFact,
    selectingVariableReturn,
    runInputsOpen,
    setRunInputsOpen,
  } = useEstimationFactsUIStore();

  const folderScope: FolderScope = currentProcessId
    ? "estimation_fact_definition"
    : "estimation_process";
  const { projectFolders, upsertProjectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    {
      scope: folderScope,
      process_id: currentProcessId,
    },
  );

  const { upsertEstimationProcess } = useEstimationProcesses(
    !!currentUser,
    currentProjectId,
  );
  const { estimationProcesses } = useEstimationProcesses(
    !!currentUser,
    currentProjectId,
  );

  // const { variables } = useEstimationIfTrees(!!currentUser, currentProjectId);
  // const availableVariables = Array.isArray(variables)
  //   ? variables.map((v: any) => v.var_key)
  //   : (variables.variables?.map((v: any) => v.var_key) ?? []);

  const scopedListItems = useMemo(() => {
    let scopedFacts: ProjectFolderNodeItem[] = [];
    if (folderScope === "estimation_fact_definition") {
      scopedFacts = factDefinitions.filter(
        (f) => f.variable_scope === variableView,
      );
    } else if (folderScope === "estimation_process") {
      scopedFacts = estimationProcesses;
    }
    return scopedFacts;
  }, [factDefinitions, variableView, folderScope, estimationProcesses]);

  const tree = useMemo(() => {
    const treeResult = buildFolderTree(
      projectFolders,
      scopedListItems,
      folderScope,
    );
    return treeResult;
  }, [projectFolders, scopedListItems, folderScope]);

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
                scope: folderScope,
                parent_folder_id:
                  selectedFolder && selectedFolder.scope === folderScope
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

  const handleAddProcess = async () => {
    if (!currentProjectId) return;
    const steps: StepConfig[] = [
      {
        name: "label",
        placeholder: "Label...",
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
            await upsertEstimationProcess({
              process_id: null,
              label: values.label,
              folder_id: selectedFolder?.id ?? null,
            });
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
        folder_id: selectedFolder?.id ?? null,
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
    setSelectedFolder({
      id: null,
      scope: folderScope,
    });
  });

  const handleFolderTypeClick = (type: VariableScope) => {
    setEditingFact(null);
    setVariableView(type);
  };

  return (
    <div
      data-no-pan
      className="relative w-[100%] h-[100%]"
      style={{
        backgroundColor: currentTheme.background_1,
        borderRight: "0.5px solid " + currentTheme.background_2,
      }}
    >
      {!currentProcessId ? (
        <div className="w-[100%] h-[100%] flex flex-col overflow-y-auto">
          <div
            data-folders-top={-1}
            className={
              "px-[15px] flex flex-row items-center justify-between pt-[12px] pb-[2px] h-[55px]"
            }
          >
            <div className="flex flex-row gap-[3.5px] items-center w-[100%]">
              <p className="select-none w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
                Estimations
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
                onClick={handleAddProcess}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_3,
                }}
              >
                <FaPlus size={12} />
              </div>
            </div>
          </div>

          <div className="w-[100%] h-[100%] overflow-y-auto flex flex-col gap-[4px]">
            {variableView === "fact" && (
              <div
                ref={containerRef}
                className={`px-[12px] flex-1 overflow-y-auto ${currentProcessRunId !== null && runInputsOpen ? "w-[calc(100%+120px)]" : "w-[100%]"}`}
              >
                {tree.map((node) => (
                  <SortableContext
                    key={node.folder_id}
                    items={node.children.map((f) => `folder-${f.folder_id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <FolderItem node={node} depth={0} scope={folderScope} />
                  </SortableContext>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-[100%] h-[100%] flex flex-col">
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
                    resetVariableUI();
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
              <div className="flex flex-row gap-[3.5px] ml-[-9px] items-center w-[100%]">
                <ChevronLeft
                  size={35}
                  color={currentTheme.background_3}
                  onClick={() => {
                    setCurrentProcessId(null);
                  }}
                  className="mt-[-8px] cursor-pointer hover:brightness-80 dim"
                />
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
                  <FolderItem node={node} depth={0} scope={folderScope} />
                </SortableContext>
              ))}
            </div>
          )}

          {variableView !== "fact" && (
            <div className="px-3 flex-1 overflow-y-auto pb-[15px]">
              {folderScope === "estimation_fact_definition" &&
                scopedListItems.map((fact) => (
                  <FactDraggableItem
                    key={fact.id}
                    fact={fact as EstimationFactDefinition}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
