// project/src/modules/EstimationModule/EstimationVariables/_helpers/variables.helpers.ts
import { Branch, Value } from "../types";
import { nanoid } from "nanoid";

export function lightenColor(color: string, amount = 1) {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 255) + 255 * amount));
  const g = Math.min(255, Math.floor(((num >> 8) & 255) + 255 * amount));
  const b = Math.min(255, Math.floor((num & 255) + 255 * amount));

  return `rgb(${r}, ${g}, ${b})`;
}

export function extractFirstReturn(branch: Branch): Value {
  if (branch.type === "return") return branch.value;
  for (const c of branch.cases) {
    const v = extractFirstReturn(c.then);
    if (v) return v;
  }
  return extractFirstReturn(branch.else);
}

// SELECTORS
export const createSelectorId = () => crypto.randomUUID();

export const literalValue = (value = ""): Value => ({
  kind: "literal",
  value,
  selector_id: createSelectorId(),
});

export const emptyVariableValue = (): Value => ({
  kind: "variable",
  var_key: "",
  var_id: "",
  selector_id: createSelectorId(),
});

export const statementValue = (): Value => ({
  kind: "statement",
  selector_id: createSelectorId(),
});

export const booleanValue = (v: boolean = false) => ({
  kind: "boolean" as const,
  value: v,
  selector_id: nanoid(),
});