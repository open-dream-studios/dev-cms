// project/src/modules/EstimationModule/EstimationRuntime/EstimationLaunch.tsx
"use client";

import { useEffect, useState } from "react";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useRunnableDecisionGraphs } from "@/contexts/queryContext/queries/estimations/runnableGraphs";
import EstimationRun from "./EstimationRun";
import { useEstimationRuntime } from "@/contexts/queryContext/queries/estimations/runtime";
import { formatDateTime } from "@/util/functions/Time";

export default function EstimationLauncher() {
  const { currentProjectId } = useCurrentDataStore();
  const { data: graphs = [], isLoading } = useRunnableDecisionGraphs(
    true,
    currentProjectId
  );

  const [resumeRunId, setResumeRunId] = useState<string | null>(null);
  const [selectedGraphIdx, setSelectedGraphIdx] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  const runtime = useEstimationRuntime(true);
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    if (!currentProjectId || !selectedGraphIdx) {
      setRuns([]);
      return;
    }

    runtime.runs.mutate(
      {
        project_idx: currentProjectId,
        decision_graph_idx: selectedGraphIdx,
      },
      {
        onSuccess: (data: any) => {
          setRuns(data ?? []);
        },
      }
    );
  }, [currentProjectId, selectedGraphIdx]);

  if (started && selectedGraphIdx) {
    return (
      <EstimationRun
        project_idx={currentProjectId!}
        decision_graph_idx={selectedGraphIdx}
        pricing_graph_idx={selectedGraphIdx}
        resumeRunId={resumeRunId}
        onExit={() => {
          setStarted(false);
          setSelectedGraphIdx(null);
          setResumeRunId(null);
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
            onClick={() => {
              setSelectedGraphIdx(g.id);
              setResumeRunId(null);
              setStarted(false);
            }}
          >
            <div className="font-medium">{g.name}</div>
            <div className="text-xs opacity-70">Version {g.version}</div>
          </button>
        ))}
      </div>

      <button
        className="mt-6 px-6 py-2 rounded-lg bg-black text-white disabled:opacity-40"
        disabled={!selectedGraphIdx}
        onClick={() => {
          setResumeRunId(null);
          setStarted(true);
        }}
      >
        Start Estimate
      </button>

      {runs.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Existing Runs</div>

          <div className="flex flex-col gap-2">
            {runs.map((r: any) => (
              <button
                key={r.estimate_run_id}
                className="border rounded-lg px-4 py-3 text-left"
                onClick={() => {
                  setResumeRunId(r.estimate_run_id);
                  setStarted(true);
                }}
              >
                <div className="text-sm">
                  Last Updated {formatDateTime(r.updated_at)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
