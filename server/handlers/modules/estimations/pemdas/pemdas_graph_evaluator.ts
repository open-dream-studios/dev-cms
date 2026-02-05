// server/handlers/modules/estimations/pemdas/pemdas_graph_evaluator.ts

import { PemdasGraphConfig } from "./pemdas_types.js";
import {
  RuntimeContext,
  ContributorResult,
  CostBreakdown,
} from "./pemdas_calculation_types.js";
import { applyOperand, fromValue, zeroBreakdown } from "./pemdas_cost_math.js";
import { resolveVariable } from "./pemdas_expression_evaluator.js";

/**
 * ============================================================
 * GRAPH EVALUATOR — STRICT BOTTOM-UP
 * ============================================================
 */

export const evaluatePemdasGraph = (
  graph: PemdasGraphConfig,
  ctx: RuntimeContext
): ContributorResult => {
  const results = new Map<string, ContributorResult>();

  // ---- dependency graph ----
  const deps = new Map<string, Set<string>>();

  for (const line of graph.lines) {
    const set = new Set<string>();
    for (const n of line.nodes) {
      if (n.kind === "contributor-bucket") {
        set.add(n.target_line_id.split("__")[1]);
      }
    }
    deps.set(line.line_id, set);
  }

  const depth = new Map<string, number>();
  const visit = (id: string): number => {
    if (depth.has(id)) return depth.get(id)!;
    const children = deps.get(id);
    if (!children || children.size === 0) {
      depth.set(id, 0);
      return 0;
    }
    const d = 1 + Math.max(...[...children].map(visit));
    depth.set(id, d);
    return d;
  };

  for (const id of deps.keys()) visit(id);

  const ordered = [...graph.lines].sort(
    (a, b) => depth.get(a.line_id)! - depth.get(b.line_id)!
  );

  console.log("\n=== LINE ORDER (BOTTOM → TOP) ===");
  ordered.forEach((l) =>
    console.log(l.line_id, "depth:", depth.get(l.line_id))
  );
  console.log("=== END ORDER ===\n");

  // ---- evaluate bottom-up ----
  for (const line of ordered) {
    const res = evaluateLine(line, graph, ctx, results);
    results.set(line.line_id, res);

    // 🔴 CRITICAL FIX:
    // Inject contributor-line result into its own buckets
    if (!line.line_id.startsWith("bucket-")) {
      const labor = results.get(`bucket-labor__${line.line_id}`);
      const materials = results.get(`bucket-materials__${line.line_id}`);
      const misc = results.get(`bucket-misc__${line.line_id}`);

      console.log("↳ INJECT LINE INTO BUCKETS:", line.line_id, res.breakdown);

      if (labor)
        labor.breakdown = applyOperand(
          labor.breakdown,
          fromValue(res.breakdown.labor, "labor"),
          "+"
        );

      if (materials)
        materials.breakdown = applyOperand(
          materials.breakdown,
          fromValue(res.breakdown.materials, "materials"),
          "+"
        );

      if (misc)
        misc.breakdown = applyOperand(
          misc.breakdown,
          fromValue(res.breakdown.misc, "misc"),
          "+"
        );
    }
  }

  return results.get(graph.lines[0].line_id)!;
};

/**
 * ============================================================
 * LINE EVALUATION
 * ============================================================
 */

const evaluateLine = (
  line: any,
  graph: PemdasGraphConfig,
  ctx: RuntimeContext,
  memo: Map<string, ContributorResult>
): ContributorResult => {
  const isBucket = line.line_id.startsWith("bucket-");

  console.log("\n--- EVALUATING LINE ---");
  console.log("LINE:", line.line_id);
  console.log(
    "NODES:",
    line.nodes.map((n: any) => ({
      kind: n.kind,
      operand: n.operand,
      target: n.target_line_id ?? null,
    }))
  );

  const evalScalar = (node: any): number => {
    if (node.kind === "constant") return node.value ?? 0;

    if (node.kind === "fact") {
      const v = ctx.factInputs[node.fact_key];
      if (v === undefined) throw new Error(`Missing fact ${node.fact_key}`);
      return Number(v);
    }

    if (node.kind === "variable") {
      if (!node.var_key) {
        throw new Error(`Variable node missing var_key`);
      }

      const key = node.var_key.toString().toLowerCase();
      return resolveVariable(key, ctx);
    }

    throw new Error(`Invalid scalar ${node.kind}`);
  };

  // ---------------- BUCKET LINE ----------------
  if (isBucket) {
    let current: number | null = null;

    for (const node of line.nodes) {
      const v = evalScalar(node);
      current =
        current === null
          ? v
          : node.operand === "+"
          ? current + v
          : node.operand === "-"
          ? current - v
          : node.operand === "*"
          ? current * v
          : v === 0
          ? current
          : current / v;
    }

    const bucket = line.line_id.startsWith("bucket-labor")
      ? "labor"
      : line.line_id.startsWith("bucket-materials")
      ? "materials"
      : "misc";

    console.log("BUCKET RESULT:", bucket, current ?? 0);

    return {
      node_id: line.line_id,
      label: "Bucket",
      breakdown: current == null ? zeroBreakdown() : fromValue(current, bucket),
      children: [],
    };
  }

  // ---------------- CONTRIBUTOR LINE ----------------
  let lineBreakdown = zeroBreakdown();
  const children: ContributorResult[] = [];
  const contributorTotals = new Map<string, CostBreakdown>();

  // ---------- 1️⃣ EVALUATE FREE (NON-CONTRIBUTOR) EXPRESSION ----------
  let freeValue: number | null = null;

  const applyOp = (a: number, b: number, op: string) => {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "*") return a * b;
    return b === 0 ? a : a / b;
  };

  for (const node of line.nodes) {
    if (node.kind === "contributor-bucket") continue;

    const v = evalScalar(node);
    freeValue = freeValue === null ? v : applyOp(freeValue, v, node.operand);
  }

  // free expression → misc
  if (freeValue !== null) {
    lineBreakdown = applyOperand(
      lineBreakdown,
      fromValue(freeValue, "misc"),
      "+"
    );
  }

  // ---------- 2️⃣ PROCESS CONTRIBUTORS ----------
  for (const node of line.nodes) {
    if (node.kind !== "contributor-bucket") continue;

    const bucket = memo.get(node.target_line_id);
    if (!bucket) throw new Error(`Missing bucket ${node.target_line_id}`);

    const contributorId = node.target_line_id.split("__")[1];
    const prev = contributorTotals.get(contributorId) ?? zeroBreakdown();
    contributorTotals.set(
      contributorId,
      applyOperand(prev, bucket.breakdown, "+")
    );
  }

  // ---------- 3️⃣ ADD CONTRIBUTORS TO LINE ----------
  for (const [id, b] of contributorTotals.entries()) {
    children.push({
      node_id: id,
      label: graph.contributorLabels[id] ?? "Contributor",
      breakdown: b,
      children: memo.get(id)?.children ?? [],
    });
    lineBreakdown = applyOperand(lineBreakdown, b, "+");
  }

  // ---------- 4️⃣ LEAF RULE ----------
  if (contributorTotals.size === 0 && line.nodes.length) {
    lineBreakdown = fromValue(lineBreakdown.total, "misc");
  }

  return {
    node_id: line.line_id,
    label: "Contributor",
    breakdown: lineBreakdown,
    children,
  };
};
