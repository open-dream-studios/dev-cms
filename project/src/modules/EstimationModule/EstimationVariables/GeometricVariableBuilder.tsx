// project/src/modules/EstimationModule/EstimationVariables/GeometricVariableBuilder.tsx
import { useContext, useState } from "react";
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
import {
  booleanValue,
  emptyVariableValue,
  extractFirstReturn,
  lightenColor,
  literalValue,
  statementValue,
} from "./_helpers/variables.helpers";
import { EstimationFactDefinition } from "@open-dream/shared";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import EnumFactEditor from "./EnumFactEditor";
import { cleanVariableKey } from "@/util/functions/Variables";

function BranchEditor({
  branch,
  onChange,
}: {
  branch: Branch;
  onChange: (b: Branch) => void;
}) {
  const currentTheme = useCurrentTheme();
  const { editingVariable } = useEstimationFactsUIStore();

  if (!editingVariable) return null;

  if (branch.type === "return") {
    return (
      <div
        style={{ borderLeft: "1px solid #444" }}
        className="pb-[16px] pt-[2px] px-[5px] flex flex-row gap-[10px] text-[15.5px] brightness-90"
      >
        <BsArrowRight
          color={lightenColor(nodeColors[editingVariable.var_type], 0.28)}
          size={19}
          className="mt-[2px]"
        />
        <strong className="mt-[1px]">RETURN</strong>
        <ValueEditor
          value={branch.value}
          allowed={["literal", "variable", "statement"]}
          target="return"
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
                    left: emptyVariableValue(),
                    operator: "==",
                    right: literalValue(""),
                  },
                  then: branch,
                },
              ],
              else: {
                type: "return",
                value: literalValue(""),
              },
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
                  left: emptyVariableValue(),
                  operator: "==",
                  right: literalValue(""),
                },
                then: {
                  type: "return",
                  value: literalValue(""),
                },
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

      <div style={{ marginLeft: 30 }}>
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
      {/* LEFT: variable | statement ONLY */}
      <ValueEditor
        value={condition.left}
        allowed={["variable", "statement"]}
        target="condition-left"
        onChange={(v) =>
          onChange({
            ...condition,
            left: v,
            operator: "==",
          })
        }
      />

      <select
        value={condition.operator}
        onChange={(e) =>
          onChange({
            ...condition,
            operator: e.target.value as Condition["operator"],
          })
        }
        className="ml-[6px] mr-[-4px] outline-none border-none cursor-pointer hover:brightness-80 dim min-w-[48px]
             appearance-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M6 8l4 4 4-4' stroke='rgba(80,80,80,0.9)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 4px center",
          backgroundSize: "18px",
        }}
      >
        <option value="==">==</option>
        <option value=">">&gt;</option>
        <option value="<">&lt;</option>
        <option value=">=">&gt;=</option>
        <option value="<=">&lt;=</option>
      </select>

      {/* RIGHT: literal | variable | statement */}
      <ValueEditor
        value={condition.right}
        allowed={["literal", "variable", "statement"]}
        target="condition-right"
        onChange={(v) => onChange({ ...condition, right: v })}
      />
    </div>
  );
}

function ValueEditor({
  value,
  onChange,
  allowed,
  target,
}: {
  value: Value;
  onChange: (v: Value) => void;
  allowed: Array<Value["kind"]>;
  target: "condition-left" | "condition-right" | "return";
}) {
  const currentTheme = useCurrentTheme();
  const {
    selectingVariableReturn,
    setSelectingVariableReturn,
    setIsEditingVariableReturn,
    setPendingVariableTarget,
    editingVariable
  } = useEstimationFactsUIStore();

  if (!editingVariable) return null

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
          if (next === "literal") onChange(literalValue(""));
          if (next === "variable") onChange(emptyVariableValue());
          if (next === "statement") onChange(statementValue());
          if (next === "boolean") onChange(booleanValue(false));
        }}
        className="select-none opacity-[0.4] text-[13px] outline-none border-none cursor-pointer hover:brightness-75 dim"
      >
        {allowed.includes("literal") && <option value="literal">Value</option>}
        {allowed.includes("variable") && (
          <option value="variable">Variable</option>
        )}
        {allowed.includes("statement") && (
          <option value="statement">Statement</option>
        )}
        {allowed.includes("boolean") && (
          <option value="boolean">True / False</option>
        )}
      </select>

      {value.kind === "literal" && (
        <input
          type="text"
          value={value.value}
          className="max-w-[110px] h-[23px] pl-[6px] ml-[2px] py-[1px] outline-none rounded-[4px]"
          style={{ border: "1px solid #444" }}
          onChange={(e) =>
            onChange({
              ...value,
              kind: "literal",
              value: e.target.value,
            })
          }
        />
      )}

      {value.kind === "variable" && (
        <div
          className="flex items-center gap-[6px] cursor-pointer"
          onClick={() => {
            setPendingVariableTarget({
              kind: target,
              set: onChange,
            });

            setSelectingVariableReturn({
              selector_id: value.selector_id,
              target,
            });
          }}
        >
          <GraphNodeIcon
            color={
              selectingVariableReturn?.selector_id === value.selector_id ||
              (value.kind === "variable" && !!value.var_key)
                ? nodeColors[editingVariable.var_type]
                : null
            }
          />
          {value.var_key && (
            <span className="pl-[2px] pr-[5px] text-[13px] opacity-80 whitespace-nowrap">
              {cleanVariableKey(value.var_key)}
            </span>
          )}
        </div>
      )}

      {value.kind === "statement" && (
        <div
          className="cursor-pointer"
          onClick={() => setIsEditingVariableReturn(true)}
        >
          <GraphNodeIcon color={null} />
        </div>
      )}

      {value.kind === "boolean" && (
        <button
          className="h-[23px] px-[8px] rounded-[4px] text-[13px] dim hover:brightness-90"
          style={{ border: "1px solid #444" }}
          onClick={() =>
            onChange({
              ...value,
              value: !value.value,
            })
          }
        >
          {value.value ? "True" : "False"}
        </button>
      )}
    </div>
  );
}

export default function GeometricVariableBuilder() {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();
  const { editingVariable, setSelectingVariableReturn } =
    useEstimationFactsUIStore();
  const { factDefinitions } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
    currentProcessId,
  );
  const [root, setRoot] = useState<Branch>({
    type: "return",
    value: literalValue(""),
  });

  if (!editingVariable) return null;

  const foundVariable = factDefinitions.find(
    (fact: EstimationFactDefinition) => fact.fact_id === editingVariable.var_id,
  );

  if (foundVariable && foundVariable.variable_scope === "fact") {
    return (
      <EnumFactEditor
        key={editingVariable.var_id}
        fact={foundVariable}
        onClose={() => resetVariableUI()}
      />
    );
  }

  return (
    <div
      onPointerDown={() => setSelectingVariableReturn(null)}
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
        variable_scope={editingVariable.var_type}
        displayOnly={true}
      />
      <BranchEditor branch={root} onChange={setRoot} />
    </div>
  );
}
