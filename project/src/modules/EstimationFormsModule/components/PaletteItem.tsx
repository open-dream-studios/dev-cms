// project/src/modules/EstimationFormsModule/components/PaletteItem.tsx
"use client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { estimationNodePalette } from "../_actions/estimationForms.actions";
import { NodePaletteKind } from "../_store/estimationForms.store";
import { clickClass } from "./EstimationFormsBuilder";

const PaletteItem = ({ kind }: { kind: NodePaletteKind }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${kind}`,
      data: { dragType: "palette", nodeKind: kind },
    });

  const item = estimationNodePalette.find((p) => p.kind === kind)!;

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`h-11 px-3 rounded-xl border border-black/10 bg-white text-[12px] font-[700] ${clickClass}`}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${item.accent}1A`, color: item.accent }}
        >
          <item.Icon size={14} />
        </div>
        <span>{item.label}</span>
      </div>
    </button>
  );
};

export default PaletteItem;
