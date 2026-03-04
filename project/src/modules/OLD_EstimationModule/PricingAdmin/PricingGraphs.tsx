// project/src/modules/EstimationModule/PricingAdmin/PricingGraphs.tsx
"use client";

import { useEffect, useState } from "react";
import { usePricingGraphs } from "@/contexts/queryContext/queries/estimations/pricing";
import { useCurrentDataStore } from "@/store/currentDataStore";

export default function PricingGraphs({
  onSelect,
}: {
  onSelect: (graphId: number) => void;
}) {
  const { currentProjectId } = useCurrentDataStore();
  const pricing = usePricingGraphs();
  const [graphs, setGraphs] = useState<any[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!currentProjectId) return;

    pricing.list.mutate(
      { project_idx: currentProjectId },
      { onSuccess: setGraphs }
    );
  }, [currentProjectId]);

  return (
    <div className="p-6 max-w-[720px] mx-auto">
      <h2 className="text-xl font-semibold mb-4">Pricing Graphs</h2>

      <div className="flex gap-2 mb-6">
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder="New graph name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() =>
            pricing.create.mutate(
              { project_idx: currentProjectId!, name },
              {
                onSuccess: () => {
                  setName("");
                  pricing.list.mutate(
                    { project_idx: currentProjectId! },
                    { onSuccess: setGraphs }
                  );
                },
              }
            )
          }
        >
          Create
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {graphs.map((g) => (
          <button
            key={g.id}
            className="border rounded px-4 py-3 text-left"
            onClick={() => onSelect(g.id)}
          >
            <div className="font-medium">{g.name}</div>
            <div className="text-xs opacity-70">
              v{g.version} · {g.status}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
