// project/src/modules/EstimationModule/PricingAdmin/PricingAdminPage.tsx
"use client";

import { useState } from "react";
import PricingGraphs from "./PricingGraphs";
import PricingGraphDetail from "./PricingGraphDetail";

export default function PricingAdminPage() {
  const [graphIdx, setGraphIdx] = useState<number | null>(null);

  if (!graphIdx) {
    return <PricingGraphs onSelect={setGraphIdx} />;
  }

  return <PricingGraphDetail graphIdx={graphIdx} />;
}