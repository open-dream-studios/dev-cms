// project/src/modules/EstimationModule/EstimationVariables/GeometricVariableBuilder.tsx
import { useState } from "react";
import { PemdasCanvas } from "../EstimationPEMDAS/components/PemdasCanvas";
import { useEstimationFactsUIStore } from "../_store/estimations.store";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { GraphNodeIcon } from "../EstimationPEMDAS/components/GraphNode";
import { Branch, Condition, Value } from "./types";

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
        style={{ border: "1px solid #444" }}
        className="p-[12px] flex flex-row gap-[10px]"
      >
        <strong>RETURN</strong>
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
              condition: {
                left: { kind: "number", value: 0 },
                operator: "==",
                right: { kind: "number", value: 0 },
              },
              then: branch,
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
    <div style={{ border: "2px solid #999", padding: 12 }}>
      <strong>IF</strong>
      <ConditionEditor
        condition={branch.condition}
        onChange={(c) => onChange({ ...branch, condition: c })}
      />

      <div style={{ marginLeft: 16 }}>
        <strong>THEN</strong>
        <BranchEditor
          branch={branch.then}
          onChange={(b) => onChange({ ...branch, then: b })}
        />

        <strong>ELSE</strong>
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
      className="flex flex-row gap-[5px] items-center h-[25px] px-[10px] rounded-[5px]"
      style={{ backgroundColor: currentTheme.background_2 }}
    >
      {/* TYPE SELECTOR */}
      <select
        value={value.kind}
        onChange={(e) => {
          const next = e.target.value as Value["kind"];
          if (next === "number") onChange({ kind: "number", value: 0 });
          if (next === "node") onChange({ kind: "node" });
          if (next === "statement") onChange({ kind: "statement" });
        }}
        className="text-[13px] outline-none border-none cursor-pointer hover:brightness-75 dim"
      >
        <option value="number">Number</option>
        <option value="node">Node</option>
        <option value="statement">Statement</option>
      </select>

      {/* NUMBER INPUT */}
      {value.kind === "number" && (
        <input
          type="number"
          value={value.value}
          className="h-[25px]"
          onChange={(e) =>
            onChange({ kind: "number", value: Number(e.target.value) })
          }
        />
      )}

      {/* NODE PICKER */}
      {value.kind === "node" && (
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
    <div style={{ width: 200, border: "1px solid #444", padding: 8 }}>
      <strong>Variables</strong>
      {vars.map((v) => (
        <div key={v}>{v}</div>
      ))}
    </div>
  );
}

export default function GeometricVariableBuilder() {
  const [root, setRoot] = useState<Branch>({
    type: "return",
    value: { kind: "number", value: 0 },
  });

  return (
    <div className="flex gap-[50px] w-[100%] h-[100%]">
      <BranchEditor branch={root} onChange={setRoot} />
    </div>
  );
}
