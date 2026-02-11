// project/src/modules/EstimationModule/components/EstimationLeftBar.tsx
"use client";
import { useContext, useMemo } from "react";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { FaPlus } from "react-icons/fa6";
import { ChevronLeft, Folder } from "lucide-react";
import {
  resetVariableUI,
  useEstimationsUIStore,
} from "../_store/estimations.store";
import {
  EstimationFactDefinition,
  FolderScope,
  VariableScope,
} from "@open-dream/shared";
import FactDraggableItem from "./VariableDraggableItem";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";
import { LuPanelLeftClose } from "react-icons/lu";
import { useEstimationProcesses } from "@/contexts/queryContext/queries/estimations/process/estimationProcess";
import FolderTree from "../../_util/Folders/FolderTree";
import { useProjectFolderHooks } from "@/modules/_util/Folders/_hooks/folders.hooks";
import {
  ProjectFolderNodeItem,
  ROOT_ID,
  useFoldersCurrentDataStore,
} from "@/modules/_util/Folders/_store/folders.store";
import { useEstimations } from "../_hooks/estimations.hooks";

export default function EstimationsLeftBar() {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const {
    currentProjectId,
    currentProcessId,
    setCurrentProcessId,
    currentProcessRunId,
  } = useCurrentDataStore();
  const { factDefinitions } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
    currentProcessId,
  );
  const {
    variableView,
    setVariableView,
    setEditingFact,
    selectingVariableReturn,
    runInputsOpen,
    setRunInputsOpen,
  } = useEstimationsUIStore();
  const { handleAddEstimationProcess, handleAddEstimationVariable } =
    useEstimations();

  const folderScope: FolderScope = currentProcessId
    ? "estimation_fact_definition"
    : "estimation_process";

  const { handleAddFolder } = useProjectFolderHooks(folderScope);
  const { estimationProcesses } = useEstimationProcesses(
    !!currentUser,
    currentProjectId,
  );

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
              <div
                data-leftbar-button
                onClick={handleAddFolder}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_3,
                }}
              >
                <Folder size={13} />
              </div>

              <div
                data-leftbar-button
                onClick={handleAddEstimationProcess}
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
              <div className={`px-[12px] flex-1 overflow-y-auto w-[100%]`}>
                <FolderTree folderScope={"estimation_process"}/>
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
                    useFoldersCurrentDataStore.getState().set((s) => ({
                      currentOpenFolders: new Set([ROOT_ID]),
                      selectedFolder: null,
                    }));
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
                    data-leftbar-button
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
                  data-leftbar-button
                  onClick={handleAddEstimationVariable}
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
            <div className={`px-3 flex-1 overflow-y-auto w-[100%]`}>
              {/* {tree.map((node) => (
                <SortableContext
                  key={node.folder_id}
                  items={node.children.map((f) => `folder-${f.folder_id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <DraggableFolderItem node={node} depth={0} scope={folderScope} />
                </SortableContext>
              ))} */}
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
