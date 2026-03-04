// project/src/modules/EstimationModule/EstimationRuntime/EstimationRun.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useEstimationRuntime } from "@/contexts/queryContext/queries/estimations/runtime";
import type { EstimationGraphNode } from "@open-dream/shared";
import QuestionRenderer from "./QuestionRenderer";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { ulid } from "ulid";
import EstimationCompleted from "./EstimationCompleted";

function evalRule(rule: any, facts: Record<string, any>) {
  if (!rule) return true;
  if (Array.isArray(rule.and))
    return rule.and.every((r: any) => evalRule(r, facts));
  if (Array.isArray(rule.or))
    return rule.or.some((r: any) => evalRule(r, facts));

  const factVal = facts?.[rule.fact];

  switch (rule.operator) {
    case ">":
      return Number(factVal) > Number(rule.value);
    case ">=":
      return Number(factVal) >= Number(rule.value);
    case "<":
      return Number(factVal) < Number(rule.value);
    case "<=":
      return Number(factVal) <= Number(rule.value);
    case "==":
      return factVal == rule.value;
    case "!=":
      return factVal != rule.value;
    case "in":
      return Array.isArray(rule.value) ? rule.value.includes(factVal) : false;
    case "contains":
      return Array.isArray(factVal) ? factVal.includes(rule.value) : false;
    default:
      return true;
  }
}

function isAnswerValid(node: EstimationGraphNode, value: any) {
  const cfg: any = node.config ?? {};
  const input_type = cfg.input_type;

  if (input_type === "text") {
    return typeof value === "string" && value.trim().length > 0;
  }

  if (input_type === "number") {
    if (value === null || value === undefined || value === "") return false;
    const n = Number(value);
    return Number.isFinite(n);
  }

  if (input_type === "boolean") {
    return value === true || value === false;
  }

  if (input_type === "select") {
    const mode = (cfg.select_mode ?? "single") as "single" | "multi";
    if (mode === "single") return typeof value === "string" && value.length > 0;
    return Array.isArray(value) && value.length > 0;
  }

  return true;
}

const EstimationRun = ({
  project_idx,
  decision_graph_idx,
  pricing_graph_idx,
  onExit,
  resumeRunId,
}: {
  project_idx: number;
  decision_graph_idx: number;
  pricing_graph_idx: number;
  onExit: () => void;
  resumeRunId?: string | null;
}) => {
  const runtime = useEstimationRuntime(true);
  const { currentProjectId } = useCurrentDataStore();

  const [runId, setRunId] = useState<string | null>(null);
  const [facts, setFacts] = useState<Record<string, any>>({});
  // const [isFirstPage, setIsFirstPage] = useState(true);
  const [nodes, setNodes] = useState<EstimationGraphNode[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isFirstChunk, setIsFirstChunk] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [pricing, setPricing] = useState<{
    total_min: number;
    total_max: number;
    inferred_tier: string;
  } | null>(null);
  const [breakdown, setBreakdown] = useState<any[] | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  useEffect(() => {
    if (!currentProjectId) return;

    const onSuccess = (res: any) => {
      setRunId(res.estimate_run_id);
      setNodes(res.chunk_nodes ?? []);
      setAnswers(res.chunk_answers ?? {});
      setFacts(res.facts ?? {});
      setIsFirstChunk(!!res.is_first_chunk);
      setCompleted(!!res.completed);
      setPricing(res.pricing ?? null);
    };

    if (resumeRunId) {
      runtime.resumeRun.mutate(
        { estimate_run_id: resumeRunId, project_idx: currentProjectId },
        { onSuccess }
      );
      return;
    }

    runtime.startRun.mutate(
      { project_idx, decision_graph_idx, pricing_graph_idx: 3 },
      { onSuccess }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId]);

  function handleAnswer(node_id: string, value: any) {
    setAnswers((prev) => ({ ...prev, [node_id]: value }));
  }

  // ✅ nodes visible on screen (node-level visibility)
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => evalRule(n.config?.visibility_rules, facts));
  }, [nodes, facts]);

  // ✅ Next button gate
  const canGoNext = useMemo(() => {
    return visibleNodes.every((n) => {
      const required = !!n.config?.required;
      if (!required) return true;
      return isAnswerValid(n, answers[n.node_id]);
    });
  }, [visibleNodes, answers]);

  async function handleNext() {
    if (!runId || !currentProjectId) return;
    if (!canGoNext) return;

    const batch_id = `BATCH-${ulid()}`;

    // submit ONLY visible nodes (don’t save hidden ones)
    for (const node of visibleNodes) {
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

    console.log(res.pricing)

    setNodes(res.chunk_nodes ?? []);
    setAnswers(res.chunk_answers ?? {});
    setFacts(res.facts ?? {});
    setIsFirstChunk(!!res.is_first_chunk);
    setCompleted(!!res.completed);
    setPricing(res.pricing ?? null);
  }

  async function handleBack() {
    if (!runId || !currentProjectId) return;

    setCompleted(false);
    setPricing(null);
    setBreakdown(null);

    const res: any = await runtime.goBack.mutateAsync({
      estimate_run_id: runId,
      project_idx: currentProjectId,
    });

    setNodes(res.chunk_nodes ?? []);
    setAnswers(res.chunk_answers ?? {});
    setFacts(res.facts ?? {});
    setIsFirstChunk(!!res.is_first_chunk);
  }

  useEffect(() => {
    if (!completed || nodes.length !== 0 || !runId || !currentProjectId) return;

    setBreakdown(null);
    setLoadingBreakdown(true);

    runtime.getBreakdown
      .mutateAsync({
        estimate_run_id: runId,
        project_idx: currentProjectId,
      })
      .then((res: any) => {
        setBreakdown(res.breakdown ?? []);
      })
      .finally(() => {
        setLoadingBreakdown(false);
      });
  }, [completed, nodes.length, runId, currentProjectId]);

  if (nodes.length === 0 && completed) {
    if (!pricing || !breakdown) {
      return (
        <div className="max-w-[720px] mx-auto p-6">
          <div className="text-gray-500">Calculating breakdown…</div>
        </div>
      );
    }

    return (
      <EstimationCompleted
        pricing={pricing}
        breakdown={breakdown}
        onBack={handleBack}
        onLeave={onExit}
      />
    );
  }

  return (
    <div className="max-w-[720px] mx-auto p-6">
      <div className="flex flex-col gap-6">
        {visibleNodes.map((node) => (
          <QuestionRenderer
            key={node.node_id}
            node={node}
            value={answers[node.node_id]}
            facts={facts}
            onChange={(v) => handleAnswer(node.node_id, v)}
          />
        ))}

        <div className="flex justify-between">
          <div className="flex gap-2">
            <button
              className="px-6 py-2 rounded-lg bg-black text-white"
              onClick={onExit}
            >
              Leave
            </button>

            <button
              className="px-6 py-2 rounded-lg bg-black text-white"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {visibleNodes.length > 0 && (
            <button
              className="px-6 py-2 rounded-lg bg-black text-white disabled:opacity-40"
              disabled={!canGoNext}
              onClick={handleNext}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstimationRun;
