// src/modules/EstimationModule/components/FactDraggableItem.tsx
import { useDraggable } from "@dnd-kit/core";
import { EstimationFactDefinition, FactType } from "@open-dream/shared";
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
import { useEstimationFactsUIStore } from "../_store/estimations.store";
import { cleanVariableKey } from "@/util/functions/Variables";

export const VariableDisplayItem = ({
  fact_key,
  fact_type,
  displayOnly,
}: {
  fact_key: string;
  fact_type: FactType;
  displayOnly: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  const { selectingVariableReturn } = useEstimationFactsUIStore();
  return (
    <div
      style={{
        backgroundColor: currentTheme.background_2_dim,
        border:
          !displayOnly && selectingVariableReturn !== null
            ? `1px dashed ${currentTheme.text_4}`
            : "1px solid transparent",
      }}
      className="w-[100%] max-w-[220px] select-none mt-[4px] flex flex-row gap-[8.5px] items-center px-2 py-1 rounded-[4px]"
    >
      <div
        className="brightness-90 w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: nodeColors.var }}
      >
        <GraphNodeIcon color={null} />
      </div>
      <div className="min-w-0">
        <div className="text-sm truncate">
          {cleanVariableKey(fact_key)}
        </div>
        <div className="text-xs opacity-60">
          {capitalizeFirstLetter(factTypeConversion(fact_type))}
        </div>
      </div>
    </div>
  );
};

export default function FactDraggableItem({
  fact,
  depth,
}: {
  fact: EstimationFactDefinition;
  depth: number;
}) {
  const { currentUser } = useContext(AuthContext);
  const { openContextMenu } = useContextMenuStore();
  const { currentProjectId } = useCurrentDataStore();
  const { modal2, setModal2 } = useUiStore();
  const { upsertFactDefinition } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId!,
  );
  const {
    isCanvasGhostActive,
    selectingVariableReturn,
    pendingVariableTarget,
    setPendingVariableTarget,
    setSelectingVariableReturn,
    setEditingVariable,
  } = useEstimationFactsUIStore();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `fact-${fact.fact_id}`,
    data: {
      kind: "FACT",
      fact,
    },
  });
  const alteredDepth = Math.max(0, depth - 1);

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
    <div
      ref={setNodeRef}
      data-draggable={selectingVariableReturn === null}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (selectingVariableReturn !== null && pendingVariableTarget) {
          pendingVariableTarget.set({
            kind: "variable",
            var_key: fact.fact_key,
            var_id: fact.fact_id,
            selector_id: selectingVariableReturn.selector_id,
          });

          setPendingVariableTarget(null);
          setSelectingVariableReturn(null);
        } else {
          setEditingVariable({ var_key: fact.fact_key, var_id: fact.fact_id });
        }
      }}
      style={{
        width: `calc(100% - ${alteredDepth * 10}px)`,
        marginLeft: `${alteredDepth * 10}px`,
        touchAction: "none",
        cursor: selectingVariableReturn !== null ? "pointer" : "grab",
        opacity: isDragging ? (isCanvasGhostActive ? 0.5 : 0) : 1,
      }}
      className="dim hover:brightness-90"
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
        displayOnly={false}
      />
    </div>
  );
}
