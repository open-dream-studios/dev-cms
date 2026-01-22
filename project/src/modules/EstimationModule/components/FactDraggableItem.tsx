// src/modules/EstimationModule/components/FactDraggableItem.tsx
import { useDraggable } from "@dnd-kit/core";
import { EstimationFactDefinition } from "@open-dream/shared";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { FaTrash } from "react-icons/fa6";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { factTypeConversion } from "../_helpers/estimations.helpers";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { createFactDefinitionContextMenu } from "../_actions/estimations.actions";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useUiStore } from "@/store/useUIStore";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";

export default function FactDraggableItem({
  fact,
  depth,
  onDelete,
}: {
  fact: EstimationFactDefinition;
  depth: number;
  onDelete: () => void;
}) {
  const { currentUser } = useContext(AuthContext);
  const theme = useCurrentTheme();
  const { openContextMenu } = useContextMenuStore();
  const { currentProjectId } = useCurrentDataStore();
  const { modal2, setModal2 } = useUiStore();
  const { upsertFactDefinition } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId!,
  );

  const { attributes, listeners, setNodeRef } = useDraggable({
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
      console.log({
        ...fact,
        fact_key: values.name,
        fact_type: values.type,
      })
      await upsertFactDefinition({
        ...fact,
        fact_key: values.name,
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
      {...attributes}
      {...listeners}
      className="select-none mt-[4px] flex items-center justify-between px-2 py-1 rounded cursor-grab dim hover:brightness-90"
      style={{
        backgroundColor: theme.background_2_dim,
        width: `calc(100% - ${alteredDepth}px)`,
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: fact,
          menu: createFactDefinitionContextMenu(handleEditFact),
        });
      }}
    >
      <div className="min-w-0">
        <div className="text-sm truncate">
          {capitalizeFirstLetter(fact.fact_key.replace("_", " "))}
        </div>
        <div className="text-xs opacity-60">
          {capitalizeFirstLetter(factTypeConversion(fact.fact_type))}
        </div>
      </div>
    </div>
  );
}
