// project/src/modules/EstimationModule/EstimationRuntime/EstimationLaunch.tsx
"use client";

import { useState } from "react";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useRunnableDecisionGraphs } from "@/contexts/queryContext/queries/estimations/runnableGraphs";
import EstimationRun from "./EstimationRun";

export default function EstimationLauncher() {
  const { currentProjectId } = useCurrentDataStore();
  const { data: graphs = [], isLoading } = useRunnableDecisionGraphs(
    true,
    currentProjectId
  );

  const [selectedGraphIdx, setSelectedGraphIdx] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  if (started && selectedGraphIdx) {
    return (
      <EstimationRun
        project_idx={currentProjectId!}
        decision_graph_idx={selectedGraphIdx}
        pricing_graph_idx={selectedGraphIdx}
        onExit={() => {
          setStarted(false);
          setSelectedGraphIdx(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-[720px] mx-auto p-6">
      <div className="text-xl font-semibold mb-4">Start an Estimate</div>

      {isLoading && <div>Loading…</div>}

      <div className="flex flex-col gap-2">
        {graphs.map((g) => (
          <button
            key={g.id}
            className={`border rounded-lg px-4 py-3 text-left ${
              selectedGraphIdx === g.id ? "bg-black text-white" : ""
            }`}
            onClick={() => setSelectedGraphIdx(g.id)}
          >
            <div className="font-medium">{g.name}</div>
            <div className="text-xs opacity-70">Version {g.version}</div>
          </button>
        ))}
      </div>

      <button
        className="mt-6 px-6 py-2 rounded-lg bg-black text-white disabled:opacity-40"
        disabled={!selectedGraphIdx}
        onClick={() => setStarted(true)}
      >
        Start Estimate
      </button>
    </div>
  );
}
