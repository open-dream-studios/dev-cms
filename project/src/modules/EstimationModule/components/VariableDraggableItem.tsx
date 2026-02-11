// src/modules/EstimationModule/components/VariableDraggableItem.tsx
import { useDraggable } from "@dnd-kit/core";
import { EstimationFactDefinition } from "@open-dream/shared";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { createFactDefinitionContextMenu } from "../_actions/estimations.actions";
import { useCurrentDataStore } from "@/store/currentDataStore";
import {
  getFactInputValue,
  openVariableIfTree,
  setFactInputValue,
  useEstimationsUIStore,
} from "../_store/estimations.store";
import VariableDisplay from "./VariableDisplay";
import { useEstimations } from "../_hooks/estimations.hooks";

const VariableDraggableItem = ({
  fact,
}: {
  fact: EstimationFactDefinition;
}) => {
  const currentTheme = useCurrentTheme();
  const { openContextMenu } = useContextMenuStore();
  const { currentProcessRunId } = useCurrentDataStore();
  const { handleEditEstimationVariable } = useEstimations();

  const {
    isCanvasGhostActive,
    selectingVariableReturn,
    pendingVariableTarget,
    setPendingVariableTarget,
    setSelectingVariableReturn,
    setEditingFact,
    runInputsOpen,
  } = useEstimationsUIStore();

  const selectingVariable =
    selectingVariableReturn !== null &&
    selectingVariableReturn.type === "variable";

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `fact-${fact.fact_id}`,
    data: {
      kind: "FOLDER-ITEM-FACT",
      item: fact,
    },
    disabled: selectingVariable,
  });

  return (
    <div className="w-[100%] h-[100%] relative">
      <div
        ref={setNodeRef}
        data-draggable
        {...attributes}
        {...listeners}
        onClick={() => {
          if (selectingVariable && pendingVariableTarget) {
            pendingVariableTarget.set({
              kind: "variable",
              var_key: fact.fact_key,
              var_id: fact.fact_id,
              var_type: fact.variable_scope,
              selector_id: selectingVariableReturn.selector_id,
            });
            setPendingVariableTarget(null);
            setSelectingVariableReturn(null);
          } else {
            const editItem = {
              var_key: fact.fact_key,
              var_id: fact.fact_id,
              var_type: fact.variable_scope,
            };
            if (fact.variable_scope === "fact") {
              setEditingFact(editItem);
            } else {
              openVariableIfTree(editItem);
            }
          }
        }}
        style={{
          touchAction: "none",
          cursor: selectingVariable ? "pointer" : "grab",
          opacity: isDragging ? (isCanvasGhostActive ? 0.5 : 0) : 1,
        }}
        className="dim hover:brightness-85"
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu({
            position: { x: e.clientX, y: e.clientY },
            target: fact,
            menu: createFactDefinitionContextMenu(handleEditEstimationVariable),
          });
        }}
      >
        <VariableDisplay
          fact_key={fact.fact_key}
          fact_type={fact.fact_type}
          variable_scope={fact.variable_scope}
          displayOnly={false}
        />
      </div>
      {currentProcessRunId !== null && runInputsOpen && (
        <div
          className="z-5001 absolute left-[238px] top-[6px] rounded-[4px]"
          style={{ backgroundColor: currentTheme.background_2_dim }}
        >
          {/* NUMBER */}
          {fact.fact_type === "number" && (
            <input
              type="text"
              inputMode="decimal"
              className="w-[98px] h-[30px] outline-none border-none px-[9px] text-[14px]"
              value={getFactInputValue(fact.fact_key)}
              onChange={(e) => {
                const v = e.target.value;
                if (!/^-?\d*\.?\d*$/.test(v)) return;
                setFactInputValue(fact.fact_key, v);
              }}
            />
          )}

          {/* STRING */}
          {fact.fact_type === "string" && (
            <input
              type="text"
              className="w-[98px] h-[30px] outline-none border-none px-[9px] text-[14px]"
              value={getFactInputValue(fact.fact_key)}
              onChange={(e) => setFactInputValue(fact.fact_key, e.target.value)}
            />
          )}

          {/* BOOLEAN */}
          {fact.fact_type === "boolean" && (
            <select
              className="w-[98px] h-[30px] px-[6px] text-[14px] outline-none border-none"
              value={getFactInputValue(fact.fact_key)}
              onChange={(e) => setFactInputValue(fact.fact_key, e.target.value)}
            >
              <option value="">—</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          )}

          {/* ENUM (✅ STORES option_id) */}
          {fact.fact_type === "enum" && (
            <select
              className="w-[98px] h-[30px] px-[6px] text-[14px] outline-none border-none"
              value={getFactInputValue(fact.fact_key)}
              onChange={(e) => setFactInputValue(fact.fact_key, e.target.value)}
            >
              <option value="">Select</option>
              {(fact.enum_options ?? []).map((opt) => (
                <option key={opt.option_id} value={opt.option_id}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
};

export default VariableDraggableItem;
