// project/src/modules/EstimationModule/EstimationsAdmin.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { HomeLayout } from "@/layouts/homeLayout";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { AuthContext } from "@/contexts/authContext";
import { FolderScope, ProjectFolder } from "@open-dream/shared";
import { usePemdasUIStore } from "./EstimationPEMDAS/_store/pemdas.store";
import {
  resetEstimationDrag,
  useEstimationsUIStore,
} from "./_store/estimations.store";
import { usePemdasCanvas } from "./EstimationPEMDAS/_hooks/pemdas.hooks";
import EstimationsLeftBar from "./components/EstimationsLeftBar";
import PemdasViewport from "./EstimationPEMDAS/components/PemdasViewport";
import IfTreeEditor from "./EstimationVariables/IfTreeEditor";
import SaveAndCancelBar from "./EstimationPEMDAS/components/SaveAndCancelBar";
import { usePemdasGraphs } from "@/contexts/queryContext/queries/estimations/pemdasGraphs";
import {
  serializePemdasState,
  deserializePemdasState,
} from "./EstimationPEMDAS/_helpers/pemdas.serialize";
import { initialState } from "./EstimationPEMDAS/state/reducer";
import FactEditor from "./EstimationVariables/EnumFactEditor";
import EstimationReport from "./EstimationReport";
import { toast } from "react-toastify";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import { openFolder } from "../_util/Folders/_actions/folders.actions";
import { useEstimationProcesses } from "@/contexts/queryContext/queries/estimations/process/estimationProcess";
import { ulid } from "ulid";
import { FolderItemDisplay } from "../_util/Folders/FolderItemDisplay";
import VariableDisplay from "./components/VariableDisplay";
import EstimationProcessItem from "./components/ProcessDisplay";
import { useFolderDndHandlers } from "../_util/Folders/_hooks/folders.hooks";
import { useFoldersCurrentDataStore } from "../_util/Folders/_store/folders.store";

export type CanvasUsage = "estimation" | "variable";

const EstimationAdmin = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const {
    currentProjectId,
    currentProcessId,
    currentProcessRunId,
    setCurrentProcessRunId,
  } = useCurrentDataStore();
  const { draggingFolderId } = useFoldersCurrentDataStore();

  const folderScope: FolderScope = currentProcessId
    ? "estimation_fact_definition"
    : "estimation_process";
  const { upsertFactDefinition } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
    currentProcessId,
  );
  const { projectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    {
      scope: folderScope,
      process_id: currentProcessId,
    },
  );
  const { upsertPemdasGraph, getPemdasGraph, calculatePemdasGraph } =
    usePemdasGraphs(!!currentUser, currentProjectId);
  const { openNodeIdTypeSelection, setOpenNodeIdTypeSelection } =
    usePemdasUIStore();
  const selectorRef = useRef<HTMLDivElement>(null);

  const {
    draggingFact,
    setDraggingFact,
    draggingProcess,
    setDraggingProcess,
    setIsCanvasGhostActive,
    editingVariable,
    editingFact,
    selectingVariableReturn,
    setSelectingVariableReturn,
    setPendingVariableTarget,
    editingConditional,
    editingAdjustment,
    setRunInputsOpen,
    factInputs,
    showEstimationReport,
    setShowEstimationReport,
    setLatestReport,
  } = useEstimationsUIStore();
  const { upsertEstimationProcess } = useEstimationProcesses(
    !!currentUser,
    currentProjectId,
  );

  useOutsideClick(selectorRef, () => setOpenNodeIdTypeSelection(null));

  const estimationPemdas = usePemdasCanvas(
    "estimation",
    String(currentProcessId ?? "none"),
  );

  usePemdasCanvas("estimation");

  const variableKey =
    selectingVariableReturn?.type === "statement"
      ? selectingVariableReturn.selector_id
      : undefined;

  const variablePemdas = usePemdasCanvas("variable", variableKey);

  const [estimationBaseline, setEstimationBaseline] = useState<string | null>(
    null,
  );
  const [variableBaseline, setVariableBaseline] = useState<string | null>(null);

  useEffect(() => {
    if (!currentProcessId) {
      usePemdasUIStore.setState((s) => ({
        graphs: { ...s.graphs, estimation: initialState },
      }));
      setEstimationBaseline(JSON.stringify(serializePemdasState(initialState)));
      return;
    }

    (async () => {
      const config = await getPemdasGraph({
        process_id: currentProcessId,
        pemdas_type: "estimation",
      });

      const restored = config ? deserializePemdasState(config) : initialState;

      usePemdasUIStore.setState((s) => ({
        graphs: { ...s.graphs, estimation: restored },
      }));

      setEstimationBaseline(JSON.stringify(serializePemdasState(restored)));
    })();
  }, [currentProcessId]);

  useEffect(() => {
    if (!selectingVariableReturn || selectingVariableReturn.type === "variable")
      return;
    requestAnimationFrame(() => {
      variablePemdas.resetPanToTop();
    });
  }, [selectingVariableReturn]);

  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const dragStartPointerRef = useRef<{ x: number; y: number } | null>(null);
  const folderDnd = useFolderDndHandlers();

  const { setNodeRef: setCanvasDropRef } = useDroppable({
    id: "CANVAS_DROP",
    data: { kind: "CANVAS" },
  });

  const handleSaveButton = async () => {
    if (!currentProcessId) return;
    const state = usePemdasUIStore.getState().graphs.estimation;
    const config = serializePemdasState(state);
    const res = await upsertPemdasGraph({
      process_id: currentProcessId,
      pemdas_type: "estimation",
      config,
    });
    if (res.success) {
      setEstimationBaseline(JSON.stringify(config));
    }
  };

  const handleBackButton = () => {};

  const activePemdas =
    selectingVariableReturn && selectingVariableReturn.type === "statement"
      ? variablePemdas
      : estimationPemdas;

  const isDirty = useMemo(() => {
    if (!estimationBaseline) return false;
    const current = JSON.stringify(
      serializePemdasState(usePemdasUIStore.getState().graphs.estimation),
    );
    return current !== estimationBaseline;
  }, [estimationPemdas.state, estimationBaseline]);

  useEffect(() => {
    if (selectingVariableReturn?.type !== "statement" || !currentProcessId)
      return;

    const id = selectingVariableReturn.selector_id;

    (async () => {
      const config = await getPemdasGraph({
        process_id: currentProcessId,
        pemdas_type: "variable",
        conditional_id: id,
      });

      const restored = config ? deserializePemdasState(config) : initialState;

      usePemdasUIStore.setState((s) => ({
        graphs: {
          ...s.graphs,
          variables: {
            ...s.graphs.variables,
            [id]: restored,
          },
        },
      }));

      setVariableBaseline(JSON.stringify(serializePemdasState(restored)));
    })();
  }, [selectingVariableReturn?.selector_id]);

  const isVariableDirty = useMemo(() => {
    if (!variableKey || !variableBaseline) return false;
    const state = usePemdasUIStore.getState().graphs.variables[variableKey];
    if (!state) return false;
    return JSON.stringify(serializePemdasState(state)) !== variableBaseline;
  }, [variablePemdas.state, variableKey, variableBaseline]);

  const handleSaveStatement = async () => {
    if (!currentProcessId || !variableKey) return;
    const state = usePemdasUIStore.getState().graphs.variables[variableKey];
    const config = serializePemdasState(state);
    await upsertPemdasGraph({
      process_id: currentProcessId,
      pemdas_type: "variable",
      conditional_id: variableKey,
      config,
    });
    setVariableBaseline(JSON.stringify(config));
  };

  const handleCalculate = async () => {
    if (!currentProcessId || !currentProcessRunId) return;
    const res = await calculatePemdasGraph({
      process_id: currentProcessId,
      process_run_id: currentProcessRunId,
      fact_inputs: factInputs,
    });
    if (res.success) {
      setLatestReport(res.estimation);
      setShowEstimationReport(true);
    } else {
      toast.warn("Estimation calculation failed");
    }
  };

  const draggingFolder = useMemo(() => {
    const result = projectFolders.find(
      (folder: ProjectFolder) => folder.folder_id === draggingFolderId,
    );
    return result;
  }, [projectFolders, draggingFolderId]);

  return (
    <div
      className="w-full h-full overflow-hidden relative"
      style={{ backgroundColor: currentTheme.background_1 }}
    >
      {showEstimationReport && (
        <div
          className="z-600 absolute top-0 left-0 w-[100%] h-[100%] "
          style={{ backgroundColor: currentTheme.background_1 }}
        >
          <EstimationReport />
        </div>
      )}

      <DndContext
        sensors={activePemdas.sensors}
        onDragStart={(e) => {
          resetEstimationDrag()
          const evt = e.activatorEvent as PointerEvent;
          dragStartPointerRef.current = {
            x: evt.clientX,
            y: evt.clientY,
          };
          const data = e.active.data.current;
          if (data?.kind === "FOLDER-ITEM-FACT") {
            setDraggingFact(data.item);
          }
          if (data?.kind === "FOLDER-ITEM-PROCESS") {
            setDraggingProcess(data.item);
          }
          if (data?.kind === "FOLDER") {
            folderDnd.onDragStart(e);
          }
          activePemdas.handlers.onDragStart(e);
        }}
        onDragMove={(e) => {
          activePemdas.handlers.onDragMove(e);
          if (!activePemdas.viewportRef.current || !dragStartPointerRef.current)
            return;
          const rect = activePemdas.viewportRef.current.getBoundingClientRect();
          const pointerX = dragStartPointerRef.current.x + e.delta.x;
          const pointerY = dragStartPointerRef.current.y + e.delta.y;
          const inside =
            pointerX >= rect.left &&
            pointerX <= rect.right &&
            pointerY >= rect.top &&
            pointerY <= rect.bottom;
          setIsCanvasGhostActive(inside && !!activePemdas.ghost);
          setIsOverCanvas(inside);
          activePemdas.setIsOverCanvas(inside);
        }}
        onDragEnd={async (e) => {
          const activeData = e.active.data.current;
          const overData = e.over?.data.current;

          if (activeData?.kind === "FOLDER" && overData?.kind === "FOLDER") {
            folderDnd.onDragEnd(e);
            return;
          }
          activePemdas.handlers.onDragEnd(e);
          const active = e.active.data.current;
          const over = e.over?.data.current;

          if (
            active?.kind.startsWith("FOLDER-ITEM") &&
            over?.kind === "FOLDER" &&
            over.folder.id !== active.item.folder_id
          ) {
            const normalizedFolderId =
              over.folder.id === -1 ? null : over.folder.id;

            if (active?.kind === "FOLDER-ITEM-FACT") {
              await upsertFactDefinition({
                ...active.item,
                folder_id: normalizedFolderId,
              });
            } else if (active?.kind === "FOLDER-ITEM-PROCESS") {
              await upsertEstimationProcess({
                ...active.item,
                folder_id: normalizedFolderId,
              });
            }

            if (normalizedFolderId) {
              const foundFolder = projectFolders.find(
                (folder: ProjectFolder) => folder.id === normalizedFolderId,
              );
              if (foundFolder) {
                openFolder(foundFolder);
              }
            }
          }
          resetEstimationDrag();
          dragStartPointerRef.current = null;
        }}
        onDragCancel={(e) => {
          activePemdas.handlers.onDragCancel(e);
          folderDnd.onDragCancel();
          resetEstimationDrag();
          setIsOverCanvas(false);
          setIsCanvasGhostActive(false);
          dragStartPointerRef.current = null;
        }}
      >
        <HomeLayout left={<EstimationsLeftBar />}>
          <div className="w-[100%] h-[100%] relative">
            {(editingVariable || editingConditional || editingAdjustment) && (
              <IfTreeEditor />
            )}
            {editingFact !== null && <FactEditor />}
            {currentProcessRunId === null ? (
              <div
                onClick={() => {
                  setCurrentProcessRunId(
                    Math.floor(10000000 + Math.random() * 90000000),
                  );
                  setRunInputsOpen(true);
                }}
                style={{ backgroundColor: currentTheme.background_2_dim }}
                className="select-none z-500 absolute right-[25px] top-[25px] rounded-[9px] px-[20px] py-[9px] cursor-pointer hover:brightness-95 dim"
              >
                <p className="text-[14px] leading-[16px] opacity-70">
                  + Estimation Run
                </p>
              </div>
            ) : (
              <div
                onClick={handleCalculate}
                style={{ backgroundColor: currentTheme.background_2_dim }}
                className="z-500 absolute right-[25px] top-[25px] rounded-[9px] px-[20px] py-[9px] cursor-pointer hover:brightness-95 dim"
              >
                <p className="text-[14px] leading-[16px] opacity-70">
                  Calculate
                </p>
              </div>
            )}

            <PemdasViewport
              key={`estimation-${currentProcessId}`}
              usage="estimation"
              viewportRef={estimationPemdas.viewportRef}
              selectorRef={selectorRef}
              state={estimationPemdas.state}
              pan={estimationPemdas.pan}
              bounds={estimationPemdas.bounds}
              visibleRows={estimationPemdas.visibleRows}
              activeLayerByRow={estimationPemdas.activeLayerByRow}
              ghost={estimationPemdas.ghost}
              reorderPreview={estimationPemdas.reorderPreview}
              ghostReorderPreview={estimationPemdas.ghostReorderPreview}
              justDroppedNodeId={estimationPemdas.justDroppedNodeId}
              activeNodeId={estimationPemdas.activeNodeId}
              openNodeIdTypeSelection={openNodeIdTypeSelection}
              dispatch={estimationPemdas.dispatch}
              handlers={estimationPemdas.handlers}
              handleEditNode={estimationPemdas.handleEditNode}
              handleAddNode={estimationPemdas.handleAddNode}
              openLayer={estimationPemdas.openLayer}
              setOpenNodeIdTypeSelection={setOpenNodeIdTypeSelection}
              setCanvasDropRef={setCanvasDropRef}
            />
            {isDirty && (
              <div className="absolute top-[20px] left-[20px]">
                <SaveAndCancelBar
                  onSave={handleSaveButton}
                  onCancel={handleBackButton}
                  backButton="back"
                  showSave={true}
                  showCancel={false}
                />
              </div>
            )}

            {selectingVariableReturn &&
              selectingVariableReturn.type === "statement" && (
                <div className="w-[100%] h-[calc(50vh-65px)] absolute bottom-0 left-0 z-500">
                  {/* {isVariableDirty && (
                    <div className="absolute top-[16px] left-[16px] z-600">
                      <SaveAndCancelBar
                        onSave={handleSaveStatement}
                        onCancel={() => {}}
                        backButton={"cancel"}
                        showSave={true}
                        showCancel={false}
                      />
                    </div>
                  )} */}
                  <PemdasViewport
                    key={`estimation-${currentProcessId}-${ulid()}`}
                    usage="variable"
                    viewportRef={variablePemdas.viewportRef}
                    selectorRef={selectorRef}
                    state={variablePemdas.state}
                    pan={variablePemdas.pan}
                    bounds={variablePemdas.bounds}
                    visibleRows={variablePemdas.visibleRows}
                    activeLayerByRow={variablePemdas.activeLayerByRow}
                    ghost={variablePemdas.ghost}
                    reorderPreview={variablePemdas.reorderPreview}
                    ghostReorderPreview={variablePemdas.ghostReorderPreview}
                    justDroppedNodeId={variablePemdas.justDroppedNodeId}
                    activeNodeId={variablePemdas.activeNodeId}
                    openNodeIdTypeSelection={openNodeIdTypeSelection}
                    dispatch={variablePemdas.dispatch}
                    handlers={variablePemdas.handlers}
                    handleEditNode={variablePemdas.handleEditNode}
                    handleAddNode={variablePemdas.handleAddNode}
                    openLayer={variablePemdas.openLayer}
                    setOpenNodeIdTypeSelection={setOpenNodeIdTypeSelection}
                    setCanvasDropRef={setCanvasDropRef}
                  />
                  <div
                    className="absolute top-4 right-6 text-[18px] opacity-[0.6] hover:brightness-75 dim cursor-pointer"
                    onClick={() => {
                      setSelectingVariableReturn(null);
                      setPendingVariableTarget(null);
                    }}
                  >
                    ✕
                  </div>
                </div>
              )}
          </div>
        </HomeLayout>
        <DragOverlay>
          {draggingFact && !isOverCanvas && (
            <VariableDisplay
              fact_key={draggingFact.fact_key}
              fact_type={draggingFact.fact_type}
              variable_scope={draggingFact.variable_scope}
              displayOnly={true}
            />
          )}

          {draggingFolder && (
            <FolderItemDisplay
              isGhost={true}
              node={null}
              name={draggingFolder.name}
              depth={0}
              listeners={null}
              outline={false}
            />
          )}

          {draggingProcess && (
            <EstimationProcessItem
              estimationProcess={draggingProcess}
              index={0}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default EstimationAdmin;
