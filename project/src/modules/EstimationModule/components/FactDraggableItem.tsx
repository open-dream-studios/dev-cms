import { useCurrentTheme } from "@/hooks/util/useTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useDraggable } from "@dnd-kit/core";
import { FaTrash } from "react-icons/fa6";
import { factTypeConversion } from "../_helpers/estimations.helpers";
import { GraphNodeIcon } from "../EstimationPEMDAS/components/GraphNode";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";

// project/src/modules/EstimationModule/components/FactDraggableItem.tsx
const FactDraggableItem = ({
  fact,
  onDelete,
}: {
  fact: any;
  onDelete: () => void;
}) => {
  const currentTheme = useCurrentTheme();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `var-${fact.fact_key}`,
    data: {
      variable: fact.fact_key,
      value: null, // facts don’t have numeric value yet
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-draggable
      {...attributes}
      {...listeners}
      style={{
        backgroundColor: currentTheme.background_2,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="select-none cursor-grab hover:brightness-88 dim
                 flex items-center justify-between rounded-md px-2 py-1"
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: nodeColors.var }}
        >
          <GraphNodeIcon />
        </div>

        {/* Text */}
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {fact.fact_key}
          </div>
          <div className="text-xs opacity-70">
            {capitalizeFirstLetter(factTypeConversion(fact.fact_type))}
          </div>
        </div>
      </div>

      {/* Delete */}
      <button
        className="text-xs w-[30px] h-[30px] flex rounded-full items-center justify-center
                   cursor-pointer hover:brightness-90 dim"
        style={{ backgroundColor: currentTheme.background_3 }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <FaTrash size={14} color={currentTheme.text_4} />
      </button>
    </div>
  );
};

export default FactDraggableItem