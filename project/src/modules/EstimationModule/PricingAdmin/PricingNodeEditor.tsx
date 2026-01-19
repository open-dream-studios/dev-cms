// project/src/modules/EstimationModule/PricingAdmin/PricingNodeEditor.tsx
"use client";

import { useState } from "react";
import { usePricingNodes } from "@/contexts/queryContext/queries/estimations/pricing";
import { useCurrentDataStore } from "@/store/currentDataStore";

export default function PricingNodeEditor({
  node,
  graphIdx,
  isNew,
  onSave,
}: {
  node?: any;
  graphIdx?: number;
  isNew?: boolean;
  onSave: () => void;
}) {
  const { currentProjectId } = useCurrentDataStore();
  const pricingNodes = usePricingNodes();

  const [label, setLabel] = useState(node?.label ?? "");

  const [config, setConfig] = useState(
    JSON.stringify(
      node?.config ?? {
        kind: "cost", // change to "var" for variable nodes
        category: "Other",
        applies_if: {},
        execution_priority: 0,
        explanation_template: "Explain why this applies.",
        // var nodes use produces:
        produces: [
          // { key: "labor_multiplier", value: 1.15, mode: "multiply" }
        ],
        // cost nodes use cost_range:
        cost_range: { min: 0, max: 0 },
      },
      null,
      2
    )
  );

  function save() {
    if (!currentProjectId) return;
    const parsed = JSON.parse(config);

    if (isNew) {
      pricingNodes.create.mutate(
        {
          project_idx: currentProjectId,
          graph_idx: graphIdx!,
          label,
          config: parsed,
        },
        { onSuccess: onSave }
      );
    } else {
      pricingNodes.update.mutate(
        {
          project_idx: currentProjectId,
          node_idx: node.id,
          label,
          config: parsed,
        },
        { onSuccess: onSave }
      );
    }
  }

  return (
    <div className="border rounded p-4">
      <input
        className="border px-3 py-2 rounded w-full mb-2"
        placeholder="Node label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <textarea
        className="border px-3 py-2 rounded w-full font-mono text-sm h-[260px]"
        value={config}
        onChange={(e) => setConfig(e.target.value)}
      />

      <div className="mt-2 flex flex-row gap[8px]">
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={save}
        >
          {isNew ? "Add Pricing Node" : "Save"}
        </button>

        {!isNew && node && (
          <button
            className="px-4 py-2 rounded bg-red-600 text-white"
            onClick={() => {
              if (!currentProjectId) return;
              if (!confirm("Delete this pricing node?")) return;

              pricingNodes.remove.mutate(
                {
                  project_idx: currentProjectId,
                  node_idx: node.id,
                },
                { onSuccess: onSave }
              );
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
