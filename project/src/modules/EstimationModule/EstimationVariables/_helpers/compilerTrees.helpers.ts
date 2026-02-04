// project/src/modules/EstimationModule/EstimationVariables/_helpers/compilerTrees.helpers.ts
import { AdjustmentOp, Branch, Condition, Value } from "../types";

export type CompiledTree = {
  expressions: any[];
  branches: {
    order_index: number;
    condition_expression_id: number | null;
    return_expression_id: number;
  }[];
};

export type CompiledAdjustmentTree = {
  expressions: any[];
  branches: {
    order_index: number;
    condition_expression_id: number | null;
    statements: {
      operation: AdjustmentOp;
      value_expression_id: number;
    }[];
  }[];
};

let idCounter = -1;
const nextId = () => idCounter--;

export function compileAdjustmentTree(root: Branch): CompiledAdjustmentTree {
  idCounter = -1;

  const expressions: any[] = [];
  const branches: any[] = [];

  function compileValue(v: Value): number {
    const id = nextId();

    if (v.kind === "literal") {
      expressions.push({
        id,
        node_type: "const",
        number_value: Number(v.value),
      });
      return id;
    }

    if (v.kind === "variable") {
      expressions.push({
        id,
        node_type: v.var_type === "fact" ? "fact_ref" : "variable_ref",
        ref_key: v.var_key,
      });
      console.log(v, {
        id,
        node_type: v.var_type === "fact" ? "fact_ref" : "variable_ref",
        ref_key: v.var_key,
      });
      return id;
    }

    if (v.kind === "statement") {
      expressions.push({
        id,
        node_type: "variable_ref",
        ref_key: v.selector_id,
      });
      return id;
    }

    throw new Error("Invalid adjustment value");
  }

  function compileCondition(c: Condition): number {
    const left = compileValue(c.left);
    const right = compileValue(c.right);
    const id = nextId();

    expressions.push({
      id,
      node_type: "operator",
      operator: c.operator,
      left_child_id: left,
      right_child_id: right,
    });

    return id;
  }

  function walk(branch: Branch) {
    if (branch.type === "adjustment-return") {
      branches.push({
        condition_expression_id: null,
        statements: branch.statements.map((s) => ({
          operation: s.operator,
          value_expression_id: compileValue(s.right),
        })),
      });
      return;
    }

    if (branch.type === "if") {
      branch.cases.forEach((c) => {
        const cond = compileCondition(c.condition);
        const idx = branches.length;
        walk(c.then);
        branches[idx].condition_expression_id = cond;
      });

      walk(branch.else);
    }
  }

  walk(root);

  return {
    expressions,
    branches: branches.map((b, i) => ({
      ...b,
      order_index: i,
    })),
  };
}

export function compileIfTree(root: Branch): CompiledTree {
  idCounter = -1;

  const expressions: any[] = [];
  const branches: any[] = [];

  function compileValue(v: Value): number {
    const id = nextId();

    if (v.kind === "literal") {
      expressions.push({
        id,
        node_type: "const",
        number_value: Number(v.value),
      });
      return id;
    }

    if (v.kind === "boolean") {
      expressions.push({
        id,
        node_type: "const",
        boolean_value: v.value,
      });
      return id;
    }

    if (v.kind === "option") {
      expressions.push({
        id,
        node_type: "const",
        string_value: v.option_id,
      });
      return id;
    }

    if (v.kind === "variable") {
      expressions.push({
        id,
        node_type: v.var_type === "fact" ? "fact_ref" : "variable_ref",
        ref_key: v.var_key,
      });
      return id;
    }

    if (v.kind === "statement") {
      expressions.push({
        id,
        node_type: "variable_ref",
        ref_key: v.selector_id,
      });
      return id;
    }

    throw new Error(`Unsupported value kind: ${v}`);
  }

  function compileCondition(c: Condition): number {
    const left = compileValue(c.left);
    const right = compileValue(c.right);
    const id = nextId();

    expressions.push({
      id,
      node_type: "operator",
      operator: c.operator,
      left_child_id: left,
      right_child_id: right,
    });

    return id;
  }

  // ✅ FIX — normalize bare return into ELSE branch
  if (root.type === "return") {
    const ret = compileValue(root.value);
    branches.push({
      order_index: 0,
      condition_expression_id: null, // ELSE
      return_expression_id: ret,
    });

    return { expressions, branches };
  }

  function walk(branch: Branch) {
    if (branch.type === "adjustment-return") {
      branches.push({
        condition_expression_id: null,
        statements: branch.statements.map((s) => ({
          operation: s.operator, // "+=" | "-=" | "*="
          value_expression_id: compileValue(s.right),
        })),
      });
      return;
    }

    if (branch.type === "if") {
      branch.cases.forEach((c) => {
        const cond = compileCondition(c.condition);
        const idx = branches.length;
        walk(c.then);
        branches[idx].condition_expression_id = cond;
      });

      walk(branch.else);
    }
  }

  walk(root);

  return {
    expressions,
    branches: branches.map((b, i) => ({
      ...b,
      order_index: i,
    })),
  };
}
