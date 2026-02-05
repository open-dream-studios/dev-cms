// src/modules/EstimationModule/components/FactDraggableItem.tsx
import { useDraggable } from "@dnd-kit/core";
import {
  EstimationFactDefinition,
  FactType,
  VariableScope,
} from "@open-dream/shared";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { capitalizeFirstLetter, displayToKey } from "@/util/functions/Data";
import { factTypeConversion } from "../_helpers/estimations.helpers";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { createFactDefinitionContextMenu } from "../_actions/estimations.actions";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useUiStore } from "@/store/useUIStore";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { GraphNodeIcon } from "../EstimationPEMDAS/components/GraphNode";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";
import {
  getFactInputValue,
  openVariableIfTree,
  setFactInputValue,
  useEstimationFactsUIStore,
} from "../_store/estimations.store";
import { cleanVariableKey } from "@/util/functions/Variables";
import { motion } from "framer-motion";
import { cubicBezier } from "framer-motion";

export const VariableDisplayItem = ({
  fact_key,
  fact_type,
  variable_scope,
  displayOnly,
}: {
  fact_key: string;
  fact_type: FactType;
  variable_scope: VariableScope;
  displayOnly: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  const { selectingVariableReturn } = useEstimationFactsUIStore();

  const dashedBorderWave = {
    animate: {
      borderColor: [
        "rgba(255,255,255,0.35)",
        "rgba(255,255,255,0.6)",
        "rgba(255,255,255,0.6)",
        "rgba(255,255,255,0.35)",
      ],
      borderDashoffset: [0, 14],
    },
    transition: {
      duration: 0.9,
      times: [0, 0.4, 0.7, 1],
      ease: [
        cubicBezier(0.37, 0.0, 0.63, 1.0),
        cubicBezier(0.37, 0.0, 0.63, 1.0),
        cubicBezier(0.37, 0.0, 0.63, 1.0),
      ],
      repeat: Infinity,
    },
  };

  const selectingVariable =
    selectingVariableReturn !== null &&
    selectingVariableReturn.type === "variable";
  return (
    <motion.div
      style={{
        backgroundColor: currentTheme.background_2_dim,
        border: "1px dashed",
        borderColor:
          !displayOnly && selectingVariable
            ? currentTheme.text_4
            : "transparent",
      }}
      {...(!displayOnly && selectingVariable ? dashedBorderWave : {})}
      className="w-[100%] max-w-[220px] select-none mt-[4px] flex flex-row gap-[8.5px] items-center px-2 py-1 rounded-[4px]"
    >
      <div
        className="brightness-90 w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: nodeColors[variable_scope] }}
      >
        <GraphNodeIcon color={null} />
      </div>
      <div className="min-w-0">
        <div className="text-sm truncate">{cleanVariableKey(fact_key)}</div>
        <div className="text-xs opacity-60">
          {capitalizeFirstLetter(factTypeConversion(fact_type))}
        </div>
      </div>
    </motion.div>
  );
};

export default function FactDraggableItem({
  fact,
}: {
  fact: EstimationFactDefinition;
}) {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { openContextMenu } = useContextMenuStore();
  const { currentProjectId, currentProcessId, currentProcessRunId } =
    useCurrentDataStore();
  const { modal2, setModal2 } = useUiStore();

  const { upsertFactDefinition } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId!,
    currentProcessId,
  );
  const {
    isCanvasGhostActive,
    selectingVariableReturn,
    pendingVariableTarget,
    setPendingVariableTarget,
    setSelectingVariableReturn,
    setEditingFact,
    runInputsOpen,
  } = useEstimationFactsUIStore();

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

  const handleEditFact = (fact: EstimationFactDefinition) => {
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
          // const trimmed = val.trim();
          // if (trimmed === "") return "Enter a number";
          // const isValidNumber = /^\d+(\s*\.\s*\d+)?$/.test(
          //   trimmed.replace(/\s+/g, " "),
          // );
          // return isValidNumber ? true : "Invalid number";
          return true;
        },
      },
    ];

    const onComplete = async (values: any) => {
      await upsertFactDefinition({
        ...fact,
        fact_key: displayToKey(values.name),
        fact_type: values.type,
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
            menu: createFactDefinitionContextMenu(handleEditFact),
          });
        }}
      >
        <VariableDisplayItem
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
}
