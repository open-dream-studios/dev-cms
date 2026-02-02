// project/src/modules/EstimationModule/EstimationVariables/GeometricVariableBuilder.tsx
import { useContext, useEffect, useState } from "react";
import {
  resetVariableUI,
  useEstimationFactsUIStore,
} from "../_store/estimations.store";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { GraphNodeIcon } from "../EstimationPEMDAS/components/GraphNode";
import { Branch, Condition, Value } from "./types";
import { VariableDisplayItem } from "../components/FactDraggableItem";
import { BsArrowRight } from "react-icons/bs";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";
import {
  booleanValue,
  emptyVariableValue,
  extractFirstReturn,
  lightenColor,
  literalValue,
  optionValue,
  statementValue,
} from "./_helpers/variables.helpers";
import {
  EstimationFactDefinition,
  EstimationFactEnumOption,
  VariableScope,
} from "@open-dream/shared";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { cleanVariableKey } from "@/util/functions/Variables";
import SaveAndCancelBar from "../EstimationPEMDAS/components/SaveAndCancelBar";
import { useEstimationIfTrees } from "@/contexts/queryContext/queries/estimations/if_trees/estimationIfTrees";
import { compileIfTree } from "./_helpers/compilerTrees.helpers";
import { rebuildIfTree } from "./_helpers/rebuildTree.helpers";

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
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();

  const { factDefinitions } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
    currentProcessId,
  );

  const left = condition.left;

  const isLeftSelected =
    left.kind === "statement" || (left.kind === "variable" && !!left.var_key);

  const leftIsNumber =
    left.kind === "statement" ||
    (left.kind === "variable" &&
      !!factDefinitions.find(
        (f) => f.fact_id === left.var_id && f.fact_type === "number",
      ));

  const allowedOperators: Condition["operator"][] = !isLeftSelected
    ? ["=="]
    : leftIsNumber
      ? ["==", ">", "<", ">=", "<="]
      : ["=="];

  const rightAllowed: Array<Value["kind"]> = (() => {
    // LEFT = STATEMENT → numeric
    if (left.kind === "statement") {
      return ["literal", "variable", "statement"];
    }

    // LEFT = VARIABLE
    if (left.kind === "variable") {
      const fact = factDefinitions.find((f) => f.fact_id === left.var_id);

      if (!fact) return ["literal"];

      if (fact.fact_type === "number") {
        return ["literal", "variable", "statement"];
      }

      if (fact.fact_type === "enum") {
        return ["option"];
      }

      if (fact.fact_type === "boolean") {
        return ["boolean"];
      }

      // text / fallback
      return ["literal"];
    }

    // default
    return ["literal"];
  })();

  function normalizeRightValue(
    allowed: Array<Value["kind"]>,
    current: Value,
  ): Value {
    if (allowed.includes(current.kind)) return current;

    if (allowed.length === 1 && allowed[0] === "boolean") {
      return booleanValue(false);
    }

    if (allowed.length === 1 && allowed[0] === "option") {
      return optionValue();
    }

    if (allowed.includes("literal")) {
      return literalValue("");
    }

    if (allowed.includes("variable")) {
      return emptyVariableValue();
    }

    if (allowed.includes("statement")) {
      return statementValue();
    }

    // fallback (should never hit)
    return literalValue("");
  }

  const rightEnumOptions: EstimationFactEnumOption[] =
    left.kind === "variable"
      ? (factDefinitions.find(
          (f) => f.fact_id === left.var_id && f.fact_type === "enum",
        )?.enum_options ?? [])
      : [];

  function isNumberValue(v: Value, facts: EstimationFactDefinition[]): boolean {
    if (v.kind === "statement") return true;
    if (v.kind !== "variable") return false;
    return !!facts.find(
      (f) => f.fact_id === v.var_id && f.fact_type === "number",
    );
  }

  function leftCategory(
    v: Value,
    facts: EstimationFactDefinition[],
  ): "number" | "boolean" | "enum" | "text" {
    if (v.kind === "statement") return "number";
    if (v.kind !== "variable") return "text";

    const fact = facts.find((f) => f.fact_id === v.var_id);
    if (!fact) return "text";

    if (fact.fact_type === "number") return "number";
    if (fact.fact_type === "boolean") return "boolean";
    if (fact.fact_type === "enum") return "enum";

    return "text";
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {/* LEFT */}
      <ValueEditor
        value={condition.left}
        allowed={["variable", "statement"]}
        target="condition-left"
        onChange={(v) => {
          const prevCategory = leftCategory(condition.left, factDefinitions);
          const nextCategory = leftCategory(v, factDefinitions);

          const nextRightAllowed: Array<Value["kind"]> = (() => {
            if (v.kind === "statement")
              return ["literal", "variable", "statement"];

            if (v.kind === "variable") {
              const fact = factDefinitions.find((f) => f.fact_id === v.var_id);
              if (!fact) return ["literal"];
              if (fact.fact_type === "number")
                return ["literal", "variable", "statement"];
              if (fact.fact_type === "enum") return ["option"];
              if (fact.fact_type === "boolean") return ["boolean"];
              return ["literal"];
            }

            return ["literal"];
          })();

          onChange({
            ...condition,
            left: v,
            operator: "==",
            right:
              prevCategory !== nextCategory
                ? normalizeRightValue(nextRightAllowed, literalValue(""))
                : normalizeRightValue(nextRightAllowed, condition.right),
          });
        }}
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
        {allowedOperators.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      {/* RIGHT */}
      <ValueEditor
        value={condition.right}
        allowed={rightAllowed}
        enumOptions={rightEnumOptions}
        target="condition-right"
        numericLiteralOnly={leftIsNumber}
        onChange={(v) => {
          onChange({ ...condition, right: v });
        }}
      />
    </div>
  );
}

function ValueEditor({
  value,
  onChange,
  allowed,
  enumOptions = [],
  target,
  numericLiteralOnly = false,
}: {
  value: Value;
  onChange: (v: Value) => void;
  allowed: Array<Value["kind"]>;
  enumOptions?: EstimationFactEnumOption[];
  target: "condition-left" | "condition-right" | "return";
  numericLiteralOnly?: boolean;
}) {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();
  const { factDefinitions } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
    currentProcessId,
  );
  const {
    setSelectingVariableReturn,
    setPendingVariableTarget,
    editingVariable,
    setVariableView,
    selectingVariableReturn,
  } = useEstimationFactsUIStore();

  const booleanOnly = allowed.length === 1 && allowed[0] === "boolean";
  const optionOnly = allowed.length === 1 && allowed[0] === "option";

  function getValueColor(
    value: Value,
    editingVariable: { var_type: VariableScope } | null,
    selectingVariableReturn: {
      selector_id: string;
      type: "variable" | "statement";
      target: "condition-left" | "condition-right" | "return";
    } | null,
  ): string | null {
    // variable: always show its own scope color if set
    if (value.kind === "variable" && value.var_key) {
      return nodeColors[value.var_type];
    }
    // statement: ONLY show color when THIS selector is being selected
    if (
      value.kind === "statement" &&
      editingVariable &&
      selectingVariableReturn?.selector_id === value.selector_id &&
      selectingVariableReturn.type === "statement"
    ) {
      return nodeColors[editingVariable.var_type];
    }
    return null;
  }

  if (!editingVariable) return null;

  return (
    <div
      className={`flex flex-row gap-[5px] items-center h-[25px] rounded-[5px] ${!booleanOnly && !optionOnly && "px-[6px]"}`}
      style={{ backgroundColor: currentTheme.background_2 }}
    >
      {!booleanOnly && !optionOnly && (
        <select
          value={value.kind}
          onChange={(e) => {
            const next = e.target.value as Value["kind"];
            if (next === "literal") onChange(literalValue(""));
            if (next === "variable") onChange(emptyVariableValue());
            if (next === "statement") onChange(statementValue());
            if (next === "boolean") onChange(booleanValue(false));
            if (next === "option") onChange(optionValue());
          }}
          className="select-none opacity-[0.4] text-[13px] outline-none border-none cursor-pointer hover:brightness-75 dim"
        >
          {allowed.includes("literal") && (
            <option value="literal">Value</option>
          )}
          {allowed.includes("variable") && (
            <option value="variable">Variable</option>
          )}
          {allowed.includes("statement") && (
            <option value="statement">Statement</option>
          )}
          {allowed.includes("boolean") && (
            <option value="boolean">True / False</option>
          )}
          {allowed.includes("option") && <option value="option">Option</option>}
        </select>
      )}

      {value.kind === "literal" && (
        <input
          type="text"
          inputMode="decimal"
          value={value.value}
          className="max-w-[110px] h-[23px] pl-[6px] ml-[2px] py-[1px] outline-none rounded-[4px]"
          style={{ border: "1px solid #444" }}
          onChange={(e) => {
            const next = e.target.value;
            const enforceNumeric = numericLiteralOnly || target === "return";
            if (enforceNumeric && !/^-?\d*\.?\d*$/.test(next)) {
              return;
            }
            onChange({
              ...value,
              kind: "literal",
              value: next,
            });
          }}
        />
      )}

      {value.kind === "variable" && (
        <div
          className="flex items-center gap-[6px] cursor-pointer"
          onClick={() => {
            // ⛔ block non-number variables at selection time
            setPendingVariableTarget({
              kind: target,
              set: (v: Value) => {
                // 🔒 enforce number-only ONLY for right side + returns
                if (
                  (target === "condition-right" || target === "return") &&
                  v.kind === "variable"
                ) {
                  const fact = factDefinitions.find(
                    (f) => f.fact_id === v.var_id,
                  );

                  if (!fact || fact.fact_type !== "number") {
                    return; // ⛔ block
                  }
                }

                onChange(v);
              },
            });

            setSelectingVariableReturn({
              selector_id: value.selector_id,
              type: "variable",
              target,
            });

            setVariableView("fact");
          }}
        >
          <GraphNodeIcon
            color={
              getValueColor(value, editingVariable, selectingVariableReturn) ??
              (selectingVariableReturn?.selector_id === value.selector_id
                ? currentTheme.text_4
                : null)
            }
            isBlinking={
              selectingVariableReturn?.selector_id === value.selector_id &&
              selectingVariableReturn?.type === "variable"
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
          onClick={() => {
            setPendingVariableTarget({
              kind: target,
              set: onChange,
            });
            setSelectingVariableReturn({
              selector_id: value.selector_id,
              type: "statement",
              target,
            });
          }}
        >
          <GraphNodeIcon
            color={currentTheme.text_4}
            isBlinking={
              selectingVariableReturn?.selector_id === value.selector_id &&
              selectingVariableReturn?.type === "statement"
            }
          />
        </div>
      )}

      {value.kind === "boolean" && (
        <button
          className="h-[23px] px-[8px] rounded-[4px] text-[13px] dim hover:brightness-85 cursor-pointer"
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

      {value.kind === "option" && (
        <div className="rounded-[4px] pl-[8px] pr-[8px] h-[23px] ">
          {enumOptions.length > 0 ? (
            <select
              value={value.option_id}
              onChange={(e) =>
                onChange({
                  kind: "option",
                  option_id: e.target.value,
                  selector_id: value.selector_id,
                })
              }
              className="h-[100%] w-[100%] text-[13px] outline-none cursor-pointer"
            >
              <option value="" disabled>
                Select option
              </option>
              {enumOptions.map((opt) => (
                <option key={opt.option_id} value={opt.option_id}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="ml-[6px] text-[12px] opacity-50">
              No options defined
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function IfTreeEditor() {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();
  const { editingVariable, setSelectingVariableReturn, setEditingFact } =
    useEstimationFactsUIStore();
  const { factDefinitions } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId,
    currentProcessId,
  );
  const {
    upsertIfTree,
    upsertExpression,
    upsertBranch,
    upsertVariable,
    upsertReturnNumber,
    loadIfTree,
    variables,
  } = useEstimationIfTrees(!!currentUser, currentProjectId);

  const [root, setRoot] = useState<Branch>({
    type: "return",
    value: literalValue(""),
  });

  useEffect(() => {
    if (!editingVariable) return;

    const varsArray = Array.isArray(variables)
      ? variables
      : Object.values(variables ?? {});

    if (varsArray.length === 0) {
      return;
    }

    const variableRecord = varsArray.find(
      (v: any) => v.var_key === editingVariable.var_key,
    );

    if (!variableRecord?.decision_tree_id) {
      setRoot({
        type: "return",
        value: literalValue(""),
      });
      return;
    }

    loadIfTree(variableRecord.decision_tree_id).then((data) => {
      const tree = rebuildIfTree(
        data.branches,
        data.expressions,
        factDefinitions,
      );
      setRoot(tree);
    });
  }, [editingVariable?.var_key, variables]);

  if (!editingVariable) return null;

  const foundVariable = factDefinitions.find(
    (fact: EstimationFactDefinition) => fact.fact_id === editingVariable.var_id,
  );
  if (foundVariable && foundVariable.variable_scope === "fact") {
    return null;
  }

  const handleSave = async () => {
    const tree = await upsertIfTree({ return_type: "number" });
    const compiled = compileIfTree(root);
    const idMap = new Map<number, number>();
    for (const expr of compiled.expressions) {
      if (expr.node_type === "operator") continue;

      const res = await upsertExpression({
        ...expr,
        id: undefined,
      });

      idMap.set(expr.id, res.id);
    }

    // PASS 2 — save operators WITH remapped children
    for (const expr of compiled.expressions) {
      if (expr.node_type !== "operator") continue;

      const res = await upsertExpression({
        ...expr,
        id: undefined,
        left_child_id: idMap.get(expr.left_child_id),
        right_child_id: idMap.get(expr.right_child_id),
      });

      idMap.set(expr.id, res.id);
    }

    // Branches — CALL upsertBranch PER BRANCH
    for (const b of compiled.branches) {
      const branchRes = await upsertBranch({
        decision_tree_id: tree.id,
        order_index: b.order_index,
        condition_expression_id:
          b.condition_expression_id != null
            ? idMap.get(b.condition_expression_id)!
            : null,
      });

      await upsertReturnNumber({
        branch_id: branchRes.id,
        value_expression_id: idMap.get(b.return_expression_id)!,
      });
    }

    // Variable
    await upsertVariable({
      var_key: editingVariable.var_key,
      decision_tree_id: tree.id,
      allowedVariableKeys: [],
    });
    resetVariableUI();
  };

  return (
    <div
      onPointerDown={() => {
        setSelectingVariableReturn(null);
        setEditingFact(null);
      }}
      style={{ backgroundColor: currentTheme.background_1 }}
      className="z-500 absolute bottom-0 left-0 flex gap-[10px] w-[100%] h-[50vh] flex-col px-[20px] py-[20px] overflow-y-auto"
    >
      <div className="flex flex-row gap-[13px] items-center">
        <p className="select-none font-[600] text-[18px] leading-[20px] opacity-[0.88]">
          {editingVariable.var_id ? "Edit Variable" : "New Variable"}
        </p>
        <SaveAndCancelBar
          onSave={handleSave}
          onCancel={() => {
            resetVariableUI();
          }}
          backButton="cancel"
          showSave={true}
          showCancel={true}
        />
      </div>
      <VariableDisplayItem
        fact_key={editingVariable.var_key}
        fact_type={"number"}
        variable_scope={editingVariable.var_type}
        displayOnly={true}
      />
      <div className="h-[0px]"></div>
      <BranchEditor branch={root} onChange={setRoot} />
    </div>
  );
}
