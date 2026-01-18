// project/src/modules/EstimationModule/EstimationRuntime/EstimationRun.tsx
"use client";

import { useEffect, useState } from "react";
import { useEstimationRuntime } from "@/contexts/queryContext/queries/estimations/runtime";
import type { EstimationGraphNode } from "@open-dream/shared";
import QuestionRenderer from "./QuestionRenderer";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { ulid } from "ulid";

export default function EstimationRun({
  project_idx,
  decision_graph_idx,
  pricing_graph_idx,
  onExit,
}: {
  project_idx: number;
  decision_graph_idx: number;
  pricing_graph_idx: number;
  onExit: () => void;
}) {
  const runtime = useEstimationRuntime(true);
  const { currentProjectId } = useCurrentDataStore();
  const [hasAnsweredAnything, setHasAnsweredAnything] = useState(false);

  const [runId, setRunId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<EstimationGraphNode[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  function samePage(a: EstimationGraphNode[], b: EstimationGraphNode[]) {
    if (a.length !== b.length) return false;
    return a.every((n, i) => n.node_id === b[i]?.node_id);
  }

  useEffect(() => {
    runtime.startRun.mutate(
      { project_idx, decision_graph_idx, pricing_graph_idx },
      {
        onSuccess: (res: any) => {
          setRunId(res.estimate_run_id);
          setNodes(res.page_nodes ?? []);
          setAnswers(res.page_answers ?? {});
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(node_id: string, value: any) {
    setAnswers((prev) => ({ ...prev, [node_id]: value }));
  }

  async function handleNext() {
    if (!runId || !currentProjectId) return;
    setHasAnsweredAnything(true);

    const batch_id = `BATCH-${ulid()}`;

    for (const node of nodes) {
      await runtime.answerNode.mutateAsync({
        estimate_run_id: runId,
        node_id: node.node_id,
        answer: answers[node.node_id],
        project_idx: currentProjectId,
        batch_id,
      });
    }

    const res: any = await runtime.fetchState.mutateAsync({
      estimate_run_id: runId,
      project_idx: currentProjectId,
    });

    setNodes(res.page_nodes ?? []);
    setAnswers(res.page_answers ?? {});
  }

  async function handleBack() {
    if (!runId || !currentProjectId) return;

    if (!hasAnsweredAnything) {
      onExit();
      return;
    }

    const res: any = await runtime.goBack.mutateAsync({
      estimate_run_id: runId,
      project_idx: currentProjectId,
    });

    setNodes(res.page_nodes ?? []);
    setAnswers(res.page_answers ?? {});
  }

  return (
    <div className="max-w-[720px] mx-auto p-6">
      <div className="flex flex-col gap-6">
        {nodes.map((node) => (
          <QuestionRenderer
            key={node.node_id}
            node={node}
            value={answers[node.node_id]}
            onChange={(v) => handleAnswer(node.node_id, v)}
          />
        ))}

        <div className="flex justify-between">
          <button
            className="px-6 py-2 rounded-lg bg-black text-white"
            onClick={handleBack}
          >
            Back
          </button>

          {nodes.length > 0 && (
            <button
              className="px-6 py-2 rounded-lg bg-black text-white"
              onClick={handleNext}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
