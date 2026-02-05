// project/src/modules/EstimationModule/EstimationsAdmin.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { HomeLayout } from "@/layouts/homeLayout";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { AuthContext } from "@/contexts/authContext";
import { EstimationFactFolder } from "@open-dream/shared";
import { ChevronRight, Folder, GripVertical } from "lucide-react";
import { usePemdasUIStore } from "./EstimationPEMDAS/_store/pemdas.store";
import { useEstimationFactsUIStore } from "./_store/estimations.store";
import { usePemdasCanvas } from "./EstimationPEMDAS/_hooks/pemdas.hooks";
import { useFolderDndHandlers } from "./_hooks/folders.hooks";
import { openFactFolder } from "./_actions/estimations.actions";
import EstimationsLeftBar from "./components/EstimationsLeftBar";
import PemdasViewport from "./EstimationPEMDAS/components/PemdasViewport";
import { GraphNodeIcon } from "./EstimationPEMDAS/components/GraphNode";
import { nodeColors } from "./EstimationPEMDAS/_constants/pemdas.constants";
import { factTypeConversion } from "./_helpers/estimations.helpers";
import IfTreeEditor from "./EstimationVariables/IfTreeEditor";
import { cleanVariableKey } from "@/util/functions/Variables";
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

  const { upsertFactDefinition, factFolders, reorderFactFolders } =
    useEstimationFactDefinitions(
      !!currentUser,
      currentProjectId,
      currentProcessId,
    );
  const { upsertPemdasGraph, getPemdasGraph, calculatePemdasGraph } =
    usePemdasGraphs(!!currentUser, currentProjectId);
  const { openNodeIdTypeSelection, setOpenNodeIdTypeSelection } =
    usePemdasUIStore();
  const selectorRef = useRef<HTMLDivElement>(null);

  const {
    setDraggingFolderId,
    draggingFact,
    setDraggingFact,
    setIsCanvasGhostActive,
    draggingFolderId,
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
  } = useEstimationFactsUIStore();

  useOutsideClick(selectorRef, () => setOpenNodeIdTypeSelection(null));

  const estimationPemdas = usePemdasCanvas("estimation");

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
    if (!currentProjectId || !currentProcessId) return;
    (async () => {
      const config = await getPemdasGraph({
        process_id: currentProcessId,
        pemdas_type: "estimation",
      });
      const restored = config
        ? deserializePemdasState(config)
        : usePemdasUIStore.getState().graphs.estimation;

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

  const folderDnd = useFolderDndHandlers({
    factFolders,
    currentProjectId,
    reorderFactFolders,
  });

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

      const restored = config
        ? deserializePemdasState(config)
        : (usePemdasUIStore.getState().graphs.variables[id] ?? initialState);

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
    console.log(res);
    if (res.success) {
      setLatestReport(res.estimation);
      setShowEstimationReport(true);
    } else {
      toast.warn("Estimation calculation failed");
    }
  };

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
          const evt = e.activatorEvent as PointerEvent;
          dragStartPointerRef.current = {
            x: evt.clientX,
            y: evt.clientY,
          };
          const data = e.active.data.current;
          if (data?.kind === "FACT") {
            setDraggingFact(data.fact);
          }
          if (data?.kind === "FOLDER") {
            setDraggingFolderId(data.folder.folder_id);
          }
          activePemdas.handlers.onDragStart(e);
          folderDnd.onDragStart(e);
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

          // 🟡 FOLDER dropped ON folder → NO reorder
          if (activeData?.kind === "FOLDER" && overData?.kind === "FOLDER") {
            console.log("FOLDER DRAG:");
            console.log("active:", activeData.folder);
            console.log("over:", overData.folder);
            setDraggingFolderId(null);
            return;
          }

          activePemdas.handlers.onDragEnd(e);
          folderDnd.onDragEnd(e);
          const active = e.active.data.current;
          const over = e.over?.data.current;
          if (
            active?.kind === "FACT" &&
            over?.kind === "FOLDER" &&
            over.folder.id !== active.fact.folder_id
          ) {
            const normalizedFolderId =
              over.folder.id === -1 ? null : over.folder.id;
            await upsertFactDefinition({
              ...active.fact,
              folder_id: normalizedFolderId,
            });

            if (normalizedFolderId) {
              const foundFolder = factFolders.find(
                (folder: EstimationFactFolder) =>
                  folder.id === normalizedFolderId,
              );
              if (foundFolder) {
                openFactFolder(foundFolder);
              }
            }
          }
          setDraggingFact(null);
          setDraggingFolderId(null);
          dragStartPointerRef.current = null;
        }}
        onDragCancel={(e) => {
          activePemdas.handlers.onDragCancel(e);
          folderDnd.onDragCancel();
          setDraggingFact(null);
          setDraggingFolderId(null);
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
                className="z-500 absolute right-[25px] top-[25px] rounded-[9px] px-[20px] py-[9px] cursor-pointer hover:brightness-95 dim"
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
            <div
              className="cursor-grab flex items-center gap-2 px-2 py-1 rounded shadow pointer-events-none"
              style={{ backgroundColor: currentTheme.background_2 }}
            >
              <div
                className="brightness-90 w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: nodeColors[draggingFact.variable_scope],
                }}
              >
                <GraphNodeIcon />
              </div>

              <div className="min-w-0">
                <div className="text-sm truncate">
                  {cleanVariableKey(draggingFact.fact_key)}
                </div>
                <div className="text-xs opacity-60">
                  {capitalizeFirstLetter(
                    factTypeConversion(draggingFact.fact_type),
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ✅ FOLDER ghost (THIS WAS MISSING) */}
          {draggingFolderId && (
            <div
              className="cursor-grab flex items-center gap-2 px-2 py-1 rounded shadow pointer-events-none"
              style={{ backgroundColor: currentTheme.background_2 }}
            >
              <ChevronRight size={14} />
              <GripVertical size={14} />
              <Folder size={16} className="mt-[1px]" />
              <span className="truncate select-none">
                {
                  factFolders.find((f) => f.folder_id === draggingFolderId)
                    ?.name
                }
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default EstimationAdmin;
