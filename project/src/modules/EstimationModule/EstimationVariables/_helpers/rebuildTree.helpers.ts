import { Branch, Value } from "../types";
import { v4 as uuid } from "uuid";
import { emptyVariableValue, literalValue } from "./variables.helpers";
import { EstimationFactDefinition } from "@open-dream/shared";

const sid = () => uuid();

export function rebuildIfTree(
  branches: any[],
  expressions: any[],
  factDefinitions: EstimationFactDefinition[]
): Branch {
  const exprMap = new Map<number, any>();
  expressions.forEach((e) => exprMap.set(e.id, e));

  const valueFromExpr = (id: number): Value => {
    const e = exprMap.get(id);
    if (!e) throw new Error("Missing expression " + id);

    if (e.node_type === "const") {
      if (e.number_value != null) {
        return {
          kind: "literal",
          value: String(e.number_value),
          selector_id: sid(),
        };
      }

      if (e.boolean_value != null) {
        return {
          kind: "boolean",
          value: e.boolean_value,
          selector_id: sid(),
        };
      }

      if (e.string_value != null) {
        return {
          kind: "option",
          option_id: e.string_value,
          selector_id: sid(),
        };
      }

      return literalValue("");
    }

    if (e.node_type === "variable_ref") {
      const isUUID =
        typeof e.ref_key === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          e.ref_key
        );

      if (isUUID) {
        return {
          kind: "statement",
          expression_id: e.ref_key,
          selector_id: e.ref_key,
        };
      }

      function variableFromRef(
        ref_key: string,
        facts: EstimationFactDefinition[]
      ): Value {
        const fact = facts.find((f) => f.fact_key === ref_key);

        if (!fact) {
          return emptyVariableValue();
        }

        return {
          kind: "variable",
          var_key: fact.fact_key,
          var_id: fact.fact_id,
          var_type: fact.variable_scope,
          selector_id: sid(),
        };
      }

      return variableFromRef(e.ref_key, factDefinitions);
    }

    throw new Error(`Unsupported expression node: ${JSON.stringify(e)}`);
  };

  function rebuildCondition(exprId: number) {
    const e = exprMap.get(exprId);
    if (!e) throw new Error("Missing condition expr " + exprId);
    if (e.node_type !== "operator")
      throw new Error("Condition expr is not operator");

    return {
      left:
        e.left_child_id < 0
          ? emptyVariableValue()
          : valueFromExpr(e.left_child_id),

      operator: e.operator,

      right:
        e.right_child_id < 0
          ? literalValue("")
          : valueFromExpr(e.right_child_id),
    };
  }

  // split branches
  const conditional = branches.filter((b) => b.condition_expression_id);
  // const elseBranch = branches.find((b) => !b.condition_expression_id);
  // if (!elseBranch) throw new Error("Missing ELSE branch");
  const elseBranch = branches.find((b) => !b.condition_expression_id);

  // no IFs → simple return
  // if (conditional.length === 0) {
  //   return {
  //     type: "return",
  //     value: valueFromExpr(elseBranch.value_expression_id),
  //   };
  // }
  if (conditional.length === 0) {
    const v =
      elseBranch?.value_expression_id != null
        ? valueFromExpr(elseBranch.value_expression_id)
        : null;

    return {
      type: "return",
      value:
        v && v.kind === "boolean"
          ? v
          : { kind: "boolean", value: false, selector_id: sid() },
    };
  }

  // WITH IFs
  return {
    type: "if",
    cases: conditional.map((b) => ({
      condition: rebuildCondition(b.condition_expression_id),
      // then: {
      //   type: "return",
      //   value: valueFromExpr(b.value_expression_id),
      // },
      then: {
        type: "return",
        value: (() => {
          const v = valueFromExpr(b.value_expression_id);
          return v.kind === "boolean"
            ? v
            : { kind: "boolean", value: false, selector_id: sid() };
        })(),
      },
    })),
    // else: {
    //   type: "return",
    //   value: valueFromExpr(elseBranch.value_expression_id),
    // },
    else: {
      type: "return",
      value: (() => {
        if (!elseBranch?.value_expression_id)
          return { kind: "boolean", value: false, selector_id: sid() };

        const v = valueFromExpr(elseBranch.value_expression_id);
        return v.kind === "boolean"
          ? v
          : { kind: "boolean", value: false, selector_id: sid() };
      })(),
    },
  };
}
