// project/src/modules/EstimationModule/EstimationsAdmin.tsx
import React, { useContext, useRef, useState } from "react";
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
import GeometricVariableBuilder from "./EstimationVariables/GeometricVariableBuilder";
import SaveAndBackBar from "./EstimationPEMDAS/components/SaveAndBackBar";

export type CanvasUsage = "estimation" | "variable";

const EstimationAdmin = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentProjectId } = useCurrentDataStore();
  const { upsertFactDefinition } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
  );
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
  } = useEstimationFactsUIStore();

  useOutsideClick(selectorRef, () => setOpenNodeIdTypeSelection(null));

  const {
    state,
    dispatch,
    sensors,
    viewportRef,
    pan,
    ghost,
    bounds,
    reorderPreview,
    justDroppedNodeId,
    handlers,
    activeNodeId,
    handleEditNode,
    handleAddNode,
    visibleRows,
    openLayer,
    activeLayerByRow,
    ghostReorderPreview,
    setIsOverCanvas: setCanvasGhostMode,
  } = usePemdasCanvas();

  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const dragStartPointerRef = useRef<{ x: number; y: number } | null>(null);

  const { factFolders, reorderFactFolders } = useEstimationFactDefinitions(
    true,
    currentProjectId,
  );

  const folderDnd = useFolderDndHandlers({
    factFolders,
    currentProjectId,
    reorderFactFolders,
  });

  const { setNodeRef: setCanvasDropRef } = useDroppable({
    id: "CANVAS_DROP",
    data: { kind: "CANVAS" },
  });

  const handleSaveButton = () => {
    // if (usage === "estimation") {
    // } else if (usage === "variable") {
    //   // await saveVariable()
    // }
  };

  const handleBackButton = () => {};

  return (
    <div
      className="w-full h-full overflow-hidden relative"
      style={{ backgroundColor: currentTheme.background_1 }}
    >
      <DndContext
        sensors={sensors}
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
          handlers.onDragStart(e);
          folderDnd.onDragStart(e);
        }}
        onDragMove={(e) => {
          handlers.onDragMove(e);
          if (!viewportRef.current || !dragStartPointerRef.current) return;
          const rect = viewportRef.current.getBoundingClientRect();
          const pointerX = dragStartPointerRef.current.x + e.delta.x;
          const pointerY = dragStartPointerRef.current.y + e.delta.y;
          const inside =
            pointerX >= rect.left &&
            pointerX <= rect.right &&
            pointerY >= rect.top &&
            pointerY <= rect.bottom;
          setIsCanvasGhostActive(inside && !!ghost);
          setIsOverCanvas(inside);
          setCanvasGhostMode(inside);
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

          handlers.onDragEnd(e);
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
          handlers.onDragCancel(e);
          folderDnd.onDragCancel();
          setDraggingFact(null);
          setDraggingFolderId(null);
          setIsOverCanvas(false);
          setIsCanvasGhostActive(false);
          dragStartPointerRef.current = null;
        }}
      >
        <HomeLayout left={<EstimationsLeftBar />}>
          {editingVariable !== null && <GeometricVariableBuilder />}
          <PemdasViewport
            usage={"estimation"}
            viewportRef={viewportRef}
            selectorRef={selectorRef}
            state={state}
            pan={pan}
            bounds={bounds}
            visibleRows={visibleRows}
            activeLayerByRow={activeLayerByRow}
            ghost={ghost}
            reorderPreview={reorderPreview}
            ghostReorderPreview={ghostReorderPreview}
            justDroppedNodeId={justDroppedNodeId}
            activeNodeId={activeNodeId}
            openNodeIdTypeSelection={openNodeIdTypeSelection}
            dispatch={dispatch}
            handlers={handlers}
            handleEditNode={handleEditNode}
            handleAddNode={handleAddNode}
            openLayer={openLayer}
            setOpenNodeIdTypeSelection={setOpenNodeIdTypeSelection}
            setCanvasDropRef={setCanvasDropRef}
          />
        </HomeLayout>
        <DragOverlay>
          {draggingFact && !isOverCanvas && (
            <div
              className="cursor-grab flex items-center gap-2 px-2 py-1 rounded shadow pointer-events-none"
              style={{ backgroundColor: currentTheme.background_2 }}
            >
              <div
                className="brightness-90 w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: nodeColors.var }}
              >
                <GraphNodeIcon />
              </div>

              <div className="min-w-0">
                <div className="text-sm truncate">
                  {capitalizeFirstLetter(
                    draggingFact.fact_key.replace("_", " "),
                  )}
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

      <div className="fixed top-[20px] left-[20px] z-500">
        <SaveAndBackBar onSave={handleSaveButton} onBack={handleBackButton} />
      </div>
    </div>
  );
};

export default EstimationAdmin;
