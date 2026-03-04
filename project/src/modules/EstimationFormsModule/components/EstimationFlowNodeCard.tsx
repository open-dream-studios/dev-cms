// project/src/modules/EstimationFormsModule/components/EstimationFormsBuilder.tsx
"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Braces,
  CircleDollarSign,
  GitBranchPlus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { EstimationBuilderNode } from "../_helpers/estimationForms.helpers";
import { clickClass } from "./EstimationFormsBuilder";

const iconByKind = {
  form: Braces,
  choice: GitBranchPlus,
  const: CircleDollarSign,
};

const toneByKind = {
  form: "#2563EB",
  choice: "#0D9488",
  const: "#D97706",
};

const EstimationFlowNodeCard = ({
  node,
  parentFormId,
  selected,
  onSelect,
  onDelete,
}: {
  node: EstimationBuilderNode;
  parentFormId: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: { dragType: "node", nodeId: node.id, parentFormId },
  });

  const Icon = iconByKind[node.kind];
  const tone = toneByKind[node.kind];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-flow-node-id={node.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <div
        className="rounded-2xl border bg-white px-3 py-2.5 mb-2"
        style={{
          borderColor: selected
            ? "rgba(14, 116, 144, 0.45)"
            : "rgba(15,23,42,0.1)",
          boxShadow: selected
            ? "0 10px 20px rgba(14,116,144,0.1)"
            : "0 4px 12px rgba(15,23,42,0.04)",
        }}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tone}18`, color: tone }}
            >
              <Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide font-[700] opacity-55 leading-none">
                {node.kind}
              </p>
              <p className="text-[12px] font-[700] truncate mt-1 leading-none">
                {node.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                border: false
                  ? "1px solid rgba(14, 165, 233, 0.52)"
                  : "1px solid transparent",
              }}
              className={`h-[30px] w-[32px] rounded-lg text-black/90 bg-slate-100 flex items-center justify-center ${clickClass}`}
              title="Rename Form"
            >
              <Pencil size={10.5} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`h-[30px] w-[32px] rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center ${clickClass}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {node.question && (
          <p className="mt-2 text-[11px] opacity-60 truncate">
            {node.question}
          </p>
        )}

        {node.kind === "const" && (
          <p className="mt-2 text-[12px] font-[700] text-amber-700">
            ${node.value}
          </p>
        )}
      </div>
    </div>
  );
};

export default EstimationFlowNodeCard;
