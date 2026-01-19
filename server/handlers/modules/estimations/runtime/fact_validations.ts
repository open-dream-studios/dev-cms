import { getFactDefinitionByKey } from "../facts/fact_definitions_repositories.js";
import type { FactType } from "../facts/fact_definitions_repositories.js";

/**
 * Resolve + coerce a fact value using the DB fact definition.
 * This is the ONLY place fact_type should be interpreted.
 */
export const coerceFactValue = async (
  project_idx: number,
  fact_key: string,
  raw: any
) => {
  const def = await getFactDefinitionByKey(project_idx, fact_key);

  if (!def) {
    throw new Error(`Fact definition not found: ${fact_key}`);
  }

  const fact_type: FactType = def.fact_type;

  if (fact_type === "boolean") {
    if (typeof raw === "boolean") return raw;
    if (raw === "true") return true;
    if (raw === "false") return false;
    throw new Error(`Expected boolean for ${fact_key}`);
  }

  if (fact_type === "number") {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
    throw new Error(`Expected number for ${fact_key}`);
  }

  if (fact_type === "string") {
    if (raw === null || raw === undefined) return "";
    return String(raw);
  }

  if (fact_type === "enum") {
    if (raw === null || raw === undefined) {
      throw new Error(`Expected enum value for ${fact_key}`);
    }
    return String(raw);
  }

  throw new Error(`Unsupported fact_type: ${fact_type}`);
};