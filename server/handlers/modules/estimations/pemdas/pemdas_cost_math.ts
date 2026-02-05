// server/handlers/modules/estimations/pemdas/pemdas_cost_math.ts
import { CostBreakdown } from "./pemdas_calculation_types.js";

export const zeroBreakdown = (): CostBreakdown => ({
  labor: 0,
  materials: 0,
  misc: 0,
  total: 0,
});

export const fromValue = (v: number, bucket: "labor" | "materials" | "misc"): CostBreakdown => ({
  labor: bucket === "labor" ? v : 0,
  materials: bucket === "materials" ? v : 0,
  misc: bucket === "misc" ? v : 0,
  total: v,
});

export const applyOperand = (
  a: CostBreakdown,
  b: CostBreakdown,
  op: "+" | "-" | "*" | "/"
): CostBreakdown => {
  if (op === "+") {
    return {
      labor: a.labor + b.labor,
      materials: a.materials + b.materials,
      misc: a.misc + b.misc,
      total: a.total + b.total,
    };
  }

  if (op === "-") {
    return {
      labor: a.labor - b.labor,
      materials: a.materials - b.materials,
      misc: a.misc - b.misc,
      total: a.total - b.total,
    };
  }

  if (op === "*") {
    return {
      labor: a.labor * b.total,
      materials: a.materials * b.total,
      misc: a.misc * b.total,
      total: a.total * b.total,
    };
  }

  if (op === "/") {
    const d = b.total === 0 ? 1 : b.total;
    return {
      labor: a.labor / d,
      materials: a.materials / d,
      misc: a.misc / d,
      total: a.total / d,
    };
  }

  return a;
};