// server/handlers/modules/estimations/pricing/pricing_graph_validation.ts
import type { PricingNodeConfig } from "./pricing_graph_types.js";

export const validatePricingNodeConfig = (cfg: PricingNodeConfig) => {
  if (!cfg) throw new Error("Missing config");

  if (!cfg.kind || (cfg.kind !== "var" && cfg.kind !== "cost")) {
    throw new Error("Pricing node missing kind (var|cost)");
  }

  if (!cfg.category) {
    throw new Error("Pricing node missing category");
  }

  if (typeof cfg.execution_priority !== "number") {
    throw new Error("Pricing node missing execution_priority");
  }

  // explanation_template is allowed to be "" (empty) for now
  if (cfg.explanation_template === undefined) {
    throw new Error("Pricing node missing explanation_template");
  }

  if (cfg.kind === "var") {
    if (!Array.isArray(cfg.produces) || cfg.produces.length === 0) {
      throw new Error("Var node must include produces[]");
    }

    for (const p of cfg.produces) {
      if (!p?.key) throw new Error("produces[] item missing key");
      // value can be 0 / false etc — only disallow null/undefined
      if (p.value === null || p.value === undefined) {
        throw new Error(`produces["${p.key}"] missing value`);
      }
      if (p.mode && !["set", "add", "multiply"].includes(p.mode)) {
        throw new Error(`produces["${p.key}"] has invalid mode`);
      }
    }

    // var nodes don't need cost_range
    return;
  }

  // cost nodes
  if (cfg.cost_range == null) {
    throw new Error("Cost node missing cost_range");
  }
  if (cfg.cost_range.min === null || cfg.cost_range.min === undefined) {
    throw new Error("Cost node missing cost_range.min");
  }
  if (cfg.cost_range.max === null || cfg.cost_range.max === undefined) {
    throw new Error("Cost node missing cost_range.max");
  }
};
