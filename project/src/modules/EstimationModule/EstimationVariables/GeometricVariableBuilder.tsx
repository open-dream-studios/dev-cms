// project/src/modules/EstimationModule/EstimationVariables/GeometricVariableBuilder.tsx
import { useState } from "react";
import {
  resetVariableUI,
  useEstimationFactsUIStore,
} from "../_store/estimations.store";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { GraphNodeIcon } from "../EstimationPEMDAS/components/GraphNode";
import { Branch, Condition, Value } from "./types";
import { VariableDisplayItem } from "../components/FactDraggableItem";
import SaveAndBackBar from "../EstimationPEMDAS/components/SaveAndBackBar";
import { BsArrowRight } from "react-icons/bs";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";

function lightenColor(color: string, amount = 1) {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 255) + 255 * amount));
  const g = Math.min(255, Math.floor(((num >> 8) & 255) + 255 * amount));
  const b = Math.min(255, Math.floor((num & 255) + 255 * amount));

  return `rgb(${r}, ${g}, ${b})`;
}

function extractFirstReturn(branch: Branch): Value {
  if (branch.type === "return") return branch.value;
  for (const c of branch.cases) {
    const v = extractFirstReturn(c.then);
    if (v) return v;
  }
  return extractFirstReturn(branch.else);
}

function BranchEditor({
  branch,
  onChange,
}: {
  branch: Branch;
  onChange: (b: Branch) => void;
}) {
  const currentTheme = useCurrentTheme();

  if (branch.type === "return") {
    return (
      <div
        style={{ borderLeft: "1px solid #444" }}
        className="pb-[16px] pt-[2px] px-[5px] flex flex-row gap-[10px] text-[15.5px] brightness-90"
      >
        {/* <strong className="mt-[1px]">RETURN</strong> */}
        <BsArrowRight color={lightenColor(nodeColors["var"], 0.28)} size={19} className="mt-[2px]" />
        <ValueEditor
          value={branch.value}
          onChange={(v) => onChange({ type: "return", value: v })}
        />
        <button
          className="h-[25px] px-[10px] rounded-[5px] cursor-pointer hover:brightness-85 dim font-[200] text-[13px]"
          style={{
            backgroundColor: currentTheme.background_2,
            color: currentTheme.text_2,
          }}
          onClick={() =>
            onChange({
              type: "if",
              cases: [
                {
                  condition: {
                    left: { kind: "number", value: 0 },
                    operator: "==",
                    right: { kind: "number", value: 0 },
                  },
                  then: branch,
                },
              ],
              else: { type: "return", value: { kind: "number", value: 0 } },
            })
          }
        >
          BRANCH
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ borderLeft: "1px solid #444" }}
      className="pb-[12px] px-[5px]"
    >
      {branch.cases.map((c, i) => (
        <div key={i}>
          <div className="flex flex-row gap-[9px] mb-[4px] text-[15.5px] brightness-90">
            <strong className="mt-[1px]">{i === 0 ? "IF" : "ELSE IF"}</strong>
            <ConditionEditor
              condition={c.condition}
              onChange={(cond) => {
                const next = [...branch.cases];
                next[i] = { ...next[i], condition: cond };
                onChange({ ...branch, cases: next });
              }}
            />
            {i > 0 && (
              <div
                style={{ backgroundColor: currentTheme.background_2 }}
                className="text-[11px] leading-[11px] flex justify-center items-center w-[20px] h-[20px] rounded-[4px] cursor-pointer hover:brightness-88 dim mt-[3.5px]"
                onClick={() => {
                  const next = branch.cases.filter((_, idx) => idx !== i);
                  if (next.length === 0) {
                    onChange({
                      type: "return",
                      value: extractFirstReturn(branch),
                    });
                    return;
                  }
                  onChange({ ...branch, cases: next });
                }}
              >
                <p className="opacity-[0.23]">✕</p>
              </div>
            )}
          </div>

          <div style={{ marginLeft: 30 }}>
            <BranchEditor
              branch={c.then}
              onChange={(b) => {
                const next = [...branch.cases];
                next[i] = { ...next[i], then: b };
                onChange({ ...branch, cases: next });
              }}
            />
          </div>
        </div>
      ))}

      <button
        className="h-[22px] pr-[8px] pl-[6px] text-[11px] rounded cursor-pointer hover:brightness-85 dim"
        style={{
          backgroundColor: currentTheme.background_2,
          color: currentTheme.text_2,
          marginLeft: -1,
          marginBottom: 6,
        }}
        onClick={() =>
          onChange({
            ...branch,
            cases: [
              ...branch.cases,
              {
                condition: {
                  left: { kind: "number", value: 0 },
                  operator: "==",
                  right: { kind: "number", value: 0 },
                },
                then: { type: "return", value: { kind: "number", value: 0 } },
              },
            ],
          })
        }
      >
        <p className="opacity-[0.4]">+ ELSE IF</p>
      </button>

      <div className="flex flex-row gap-[9px] mb-[4px] text-[15.5px] brightness-90">
        <strong className="mt-[1px]">ELSE</strong>
        <div
          style={{ backgroundColor: currentTheme.background_2 }}
          className="text-[11px] leading-[11px] flex justify-center items-center w-[20px] h-[20px] rounded-[4px] cursor-pointer hover:brightness-88 dim mt-[3.5px]"
          onClick={() =>
            onChange({
              type: "return",
              value: extractFirstReturn(branch),
            })
          }
        >
          <p className="opacity-[0.23]">✕</p>
        </div>
      </div>

      <div style={{ marginLeft: 16 }}>
        <BranchEditor
          branch={branch.else}
          onChange={(b) => onChange({ ...branch, else: b })}
        />
      </div>
    </div>
  );
}

function ConditionEditor({
  condition,
  onChange,
}: {
  condition: Condition;
  onChange: (c: Condition) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <ValueEditor
        value={condition.left}
        onChange={(v) => onChange({ ...condition, left: v })}
      />

      <select
        value={condition.operator}
        onChange={(e) =>
          onChange({
            ...condition,
            operator: e.target.value as Condition["operator"],
          })
        }
      >
        <option value="==">==</option>
        <option value=">=">&gt;=</option>
        <option value="<=">&lt;=</option>
        <option value="AND">AND</option>
        <option value="OR">OR</option>
      </select>

      <ValueEditor
        value={condition.right}
        onChange={(v) => onChange({ ...condition, right: v })}
      />
    </div>
  );
}

function ValueEditor({
  value,
  onChange,
}: {
  value: Value;
  onChange: (v: Value) => void;
}) {
  const currentTheme = useCurrentTheme();
  const { setIsSelectingVariableReturn, setIsEditingVariableReturn } =
    useEstimationFactsUIStore();

  return (
    <div
      className="flex flex-row gap-[5px] items-center h-[25px] px-[6px] rounded-[5px]"
      style={{ backgroundColor: currentTheme.background_2 }}
    >
      {/* TYPE SELECTOR */}
      <select
        value={value.kind}
        onChange={(e) => {
          const next = e.target.value as Value["kind"];
          if (next === "number") onChange({ kind: "number", value: 0 });
          if (next === "variable") onChange({ kind: "variable" });
          if (next === "statement") onChange({ kind: "statement" });
        }}
        className="opacity-[0.4] text-[13px] outline-none border-none cursor-pointer hover:brightness-75 dim"
      >
        <option value="number">Number</option>
        <option value="variable">Variable</option>
        <option value="statement">Statement</option>
      </select>

      {/* NUMBER INPUT */}
      {value.kind === "number" && (
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value.value}
          className="max-w-[85px] h-[23px] pl-[6px] ml-[2px] py-[1px] outline-none rounded-[4px]"
          style={{ border: "1px solid #444" }}
          onChange={(e) => {
            const v = e.target.value;
            if (/^\d*$/.test(v)) {
              onChange({ kind: "number", value: v === "" ? 0 : Number(v) });
            }
          }}
        />
      )}

      {/* NODE PICKER */}
      {value.kind === "variable" && (
        <div
          className="cursor-pointer"
          onClick={() => {
            setIsSelectingVariableReturn(true);
          }}
        >
          <GraphNodeIcon />
        </div>
      )}

      {/* STATEMENT PICKER */}
      {value.kind === "statement" && (
        <div
          className="cursor-pointer"
          onClick={() => {
            setIsEditingVariableReturn(true);
          }}
        >
          <GraphNodeIcon />
        </div>
      )}
    </div>
  );
}

export function VariablePalette({ vars }: { vars: string[] }) {
  return (
    <div style={{ width: 200, borderLeft: "1px solid #444", padding: 8 }}>
      <strong>Variables</strong>
      {vars.map((v) => (
        <div key={v}>{v}</div>
      ))}
    </div>
  );
}

export default function GeometricVariableBuilder() {
  const currentTheme = useCurrentTheme();
  const { editingVariable } = useEstimationFactsUIStore();
  const [root, setRoot] = useState<Branch>({
    type: "return",
    value: { kind: "number", value: 0 },
  });

  if (!editingVariable) return null;

  return (
    <div
      style={{ backgroundColor: currentTheme.background_1 }}
      className="z-500 absolute top-0 left-0 flex gap-[10px] w-[100%] h-[100%] flex-col px-[20px] py-[20px] overflow-y-auto"
    >
      <div className="flex flex-row gap-[13px] items-center">
        <p className="select-none font-[600] text-[18px] leading-[20px] opacity-[0.88]">
          {editingVariable.var_id ? "Edit Variable" : "New Variable"}
        </p>
        <SaveAndBackBar
          onSave={() => {}}
          onBack={() => {
            resetVariableUI();
          }}
        />
      </div>
      <VariableDisplayItem
        fact_key={editingVariable.var_key}
        fact_type={"number"}
      />
      <BranchEditor branch={root} onChange={setRoot} />
    </div>
  );
}
