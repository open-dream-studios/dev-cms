// server/handlers/modules/estimations/runtime/fact_validations.ts
import { FactType } from "../facts/fact_definitions_repositories.js";

export const coerceFactValue = (fact_type: FactType, value: any) => {
  if (fact_type === "boolean") {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error("Expected boolean");
  }

  if (fact_type === "number") {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
    throw new Error("Expected number");
  }

  if (fact_type === "string") {
    if (value === null || value === undefined) return "";
    return String(value);
  }

  if (fact_type === "enum") {
    // MVP: enum is stored as string; allowed-values can be added later
    if (value === null || value === undefined) throw new Error("Expected enum value");
    return String(value);
  }

  throw new Error(`Unsupported fact_type: ${fact_type}`);
};