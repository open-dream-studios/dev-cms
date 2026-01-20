// server/handlers/modules/estimations/pricing_graphs/pricing_graph_types.ts
export type PricingCategory =
  | "Labor"
  | "Materials"
  | "Demo"
  | "Permits"
  | "Contingency"
  | "Other";

export type ProduceMode = "set" | "add" | "multiply";

export type PricingProduce = {
  key: string;          // e.g. "labor_multiplier"
  value: any;           // expression or literal
  mode?: ProduceMode;   // default "set"
};

export type PricingNodeKind = "var" | "cost";

export type PricingNodeConfig = {
  kind: PricingNodeKind;           // ✅ NEW (var vs cost)
  category: PricingCategory;

  applies_if?: any | null;

  // ✅ var nodes use `produces`
  produces?: PricingProduce[];

  // ✅ cost nodes use `cost_range` (expressions)
  cost_range?: {
    min: any;
    max: any;
  } | null;

  explanation_template?: string | null;

  execution_priority: number;
};