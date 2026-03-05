// project/src/modules/EstimationFormsModule/components/EstimationFlowNodeCard.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Braces,
  CircleDollarSign,
  GitBranchPlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  EstimationBuilderChoiceNode,
  EstimationBuilderNode,
} from "../_helpers/estimationForms.helpers";
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
  onUpdate,
  onOpenChoiceCase,
  onAddChoiceCase,
  onRemoveChoiceCase,
  onUpdateChoiceCaseName,
}: {
  node: EstimationBuilderNode;
  parentFormId: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (patch: {
    name?: string;
    question?: string;
    value?: number;
  }) => void;
  onOpenChoiceCase: (caseId: string) => void;
  onAddChoiceCase: () => void;
  onRemoveChoiceCase: (caseId: string) => void;
  onUpdateChoiceCaseName: (caseId: string, name: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState(node.name || "");
  const [editingQuestion, setEditingQuestion] = useState(node.question || "");
  const [editingValue, setEditingValue] = useState(
    String(node.kind === "const" ? node.value : ""),
  );
  const nameInputRef = useRef<HTMLInputElement | null>(null);

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
    disabled: editing,
  });

  const Icon = iconByKind[node.kind];
  const tone = toneByKind[node.kind];

  useEffect(() => {
    if (!editing) return;
    const el = nameInputRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [editing]);

  useEffect(() => {
    if (editing) return;
    setEditingName(node.name || "");
    setEditingQuestion(node.question || "");
    if (node.kind === "const") {
      setEditingValue(String(node.value));
    }
  }, [
    node.name,
    node.question,
    node.kind,
    node.kind === "const" ? node.value : null,
    editing,
  ]);

  const saveEdits = () => {
    onUpdate({
      name: editingName.trim(),
      question: editingQuestion,
      ...(node.kind === "const"
        ? {
            value: Number.isFinite(Number(editingValue))
              ? Number(editingValue)
              : 0,
          }
        : {}),
    });
    setEditing(false);
  };

  const cancelEdits = () => {
    setEditing(false);
    setEditingName(node.name || "");
    setEditingQuestion(node.question || "");
    if (node.kind === "const") {
      setEditingValue(String(node.value));
    }
  };

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
              <p className="select-none text-[10px] uppercase tracking-wide font-[700] opacity-55 leading-none">
                {node.kind}
              </p>
              <div className="mt-1 h-[15px] leading-[15px] flex items-center">
                {editing ? (
                  <input
                    ref={nameInputRef}
                    value={editingName}
                    onChange={(e) => {
                      const v = e.target.value
                        .replace(/^ /, "") // no leading space
                        .replace(/\. $/, " ") // fix mac double-space -> ". "
                        .replace(/\s{2,}/g, " "); // block multiple spaces anywhere

                      setEditingName(v);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === " " && editingName.endsWith(" ")) {
                        e.preventDefault();
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdits();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEdits();
                      }
                    }}
                    className="text-[12px] leading-[15px] bg-transparent font-[700] truncate border-none outline-none w-full p-0 m-0 appearance-none align-middle"
                  />
                ) : (
                  <p className="text-[12px] leading-[15px] font-[700] truncate m-0 p-0">
                    {node.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (editing) {
                  saveEdits();
                  return;
                }
                setEditing(true);
              }}
              style={{
                border: editing
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
                if (editing) return;
                e.stopPropagation();
                onDelete();
              }}
              className={`h-[30px] w-[32px] rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center ${clickClass}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {editing ? (
          <textarea
            value={editingQuestion}
            onChange={(e) => setEditingQuestion(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 w-full min-h-[68px] rounded-lg border border-black/12 bg-white/90 px-2.5 py-2 text-[11px] outline-none"
            placeholder="Question (optional)"
          />
        ) : (
          node.question && (
            <p className="mt-2 text-[11px] opacity-60 truncate">
              {node.question}
            </p>
          )
        )}

        {node.kind === "const" &&
          (editing ? (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[12px] font-[700] text-amber-700">$</span>
              <input
                value={editingValue}
                onChange={(e) => {
                  let v = e.target.value;

                  // allow only digits, one '.', and optional leading '-'
                  v = v.replace(/[^0-9.-]/g, "");

                  // only one leading '-'
                  if (v.includes("-")) {
                    v = (v.startsWith("-") ? "-" : "") + v.replace(/-/g, "");
                  }

                  // only one decimal
                  const parts = v.split(".");
                  if (parts.length > 2) {
                    v = parts[0] + "." + parts.slice(1).join("");
                  }

                  // max two decimals
                  if (v.includes(".")) {
                    const [int, dec] = v.split(".");
                    v = int + "." + dec.slice(0, 2);
                  }

                  setEditingValue(v);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-full rounded-lg border border-amber-200 bg-amber-50/70 px-2 text-[12px] font-[700] text-amber-800 outline-none"
              />
            </div>
          ) : (
            <p className="mt-2 text-[12px] font-[700] text-amber-700">
              {(() => {
                const v = Number(node.value);
                const formatted = Math.abs(v).toLocaleString();
                return v < 0 ? `-$${formatted}` : `$${formatted}`;
              })()}
            </p>
          ))}

        {node.kind === "choice" && (
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              selected || editing
                ? "max-h-[230px] opacity-100 mt-[2px]"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="rounded-lg border border-slate-200 bg-slate-50/75 p-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-[700] uppercase tracking-wide opacity-65">
                  Options
                </p>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddChoiceCase();
                  }}
                  className={`h-6 px-2 rounded-md bg-white/90 border border-slate-200  text-slate-700 text-[10px] font-[700] flex items-center gap-1 ${clickClass}`}
                >
                  <Plus size={11} />
                  Add
                </button>
              </div>

              <div className="space-y-1.5">
                {(node as EstimationBuilderChoiceNode).cases.map((formCase) => (
                  <div
                    key={formCase.id}
                    className={`h-7 rounded-md border border-slate-200 bg-white/90 pl-2 pr-[6.5px] flex items-center gap-1.5 ${
                      editing ? "" : clickClass
                    }`}
                    onClick={() => {
                      if (editing) return;
                      onOpenChoiceCase(formCase.id);
                    }}
                  >
                    {editing ? (
                      <input
                        value={formCase.name}
                        onChange={(e) => {
                          const v = e.target.value
                            .replace(/^ /, "") // no leading space
                            .replace(/\. $/, " ") // fix mac double-space -> ". "
                            .replace(/\s{2,}/g, " "); // block multiple spaces anywhere

                          onUpdateChoiceCaseName(formCase.id, v);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent outline-none text-[11px] font-[600]"
                      />
                    ) : (
                      <p className="w-full text-[11px] font-[600] truncate">
                        {formCase.name}
                      </p>
                    )}

                    {(node as EstimationBuilderChoiceNode).cases.length > 1 && (
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemoveChoiceCase(formCase.id);
                        }}
                        className={`h-[18px] w-[18px] rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center ${clickClass}`}
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimationFlowNodeCard;
