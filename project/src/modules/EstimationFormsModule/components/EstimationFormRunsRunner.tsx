// project/src/modules/EstimationFormsModule/components/EstimationFormRunsRunner.tsx
"use client";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FolderTree,
  GitBranchPlus,
  Play,
  RotateCcw,
  Route,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEstimationFormRunsModule } from "../_hooks/estimationFormRuns.hooks";
import {
  BUCKET_BG_COLORS,
  BUCKET_COLORS,
  type EstimationBuilderNode,
  type EstimationCostBucket,
} from "../_helpers/estimationForms.helpers";

const clickClass =
  "cursor-pointer dim hover:brightness-[80%] transition-all duration-200";

type BucketTotals = Record<EstimationCostBucket, number> & { total: number };

type ReportTreeNode = {
  id: string;
  label: string;
  type: "form" | "choice" | "const";
  bucketTotals: BucketTotals;
  children: ReportTreeNode[];
  parentId: string | null;
  depth: number;
  meta?: string;
};

const emptyTotals = (): BucketTotals => ({
  labor: 0,
  materials: 0,
  misc: 0,
  total: 0,
});

const addTotals = (a: BucketTotals, b: BucketTotals): BucketTotals => ({
  labor: a.labor + b.labor,
  materials: a.materials + b.materials,
  misc: a.misc + b.misc,
  total: a.total + b.total,
});

const bucketLabel: Record<EstimationCostBucket, string> = {
  labor: "Labor",
  materials: "Materials",
  misc: "Misc",
};

const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

export default function EstimationFormRunsRunner() {
  const {
    selectedForm,
    activeFormNode,
    selectedCaseByChoiceId,
    runComplete,
    showResults,
    flatAdjustment,
    percentAdjustment,
    setShowResults,
    setFlatAdjustment,
    setPercentAdjustment,
    onNavigateToFormNode,
    onNavigateUp,
    onChooseCase,
    onRunEstimation,
    onResetCurrentRun,
    completionForActiveForm,
  } = useEstimationFormRunsModule();

  const [variancePct, setVariancePct] = useState(15);
  const [focusedReportNodeId, setFocusedReportNodeId] = useState<string | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());

  if (!selectedForm) {
    return (
      <div className="w-full h-full p-4">
        <div className="w-full h-full rounded-2xl border border-black/8 bg-white/65 flex items-center justify-center text-sm opacity-70">
          No published, valid forms available to run.
        </div>
      </div>
    );
  }

  const currentSectionName = (() => {
    if (!activeFormNode) return selectedForm.name;
    if (activeFormNode.id === selectedForm.root.id) return selectedForm.name;

    const rawName = (activeFormNode.name || "").trim();
    const lower = rawName.toLowerCase();
    if (lower === "yes" || lower === "no") {
      let found: string | null = null;
      const walk = (node: any) => {
        if (found) return;
        for (const child of node.children || []) {
          if (child.kind === "choice") {
            if (child.cases.some((c: any) => c.id === activeFormNode.id)) {
              found = child.name || null;
              return;
            }
            child.cases.forEach((c: any) => walk(c));
          }
          if (child.kind === "form") walk(child);
        }
      };
      walk(selectedForm.root);
      if (found) return `${found} - ${rawName}`;
    }

    return rawName || selectedForm.name;
  })();

  const canGoBack = !!activeFormNode && activeFormNode.id !== selectedForm.root.id;

  const hasInteractiveRoute = (formNode: any) => {
    const walk = (node: any): boolean => {
      for (const child of node.children) {
        if (child.kind === "choice" || child.kind === "form") return true;
      }
      for (const child of node.children) {
        if (child.kind === "form" && walk(child)) return true;
        if (child.kind === "choice") {
          for (const option of child.cases) {
            if (walk(option)) return true;
          }
        }
      }
      return false;
    };
    return walk(formNode);
  };

  const hasNonConstChildren = (formNode: any) =>
    formNode.children.some((child: any) => child.kind !== "const");

  const isConstOnlyForm = (formNode: any) =>
    formNode.children.length > 0 &&
    formNode.children.every((child: any) => child.kind === "const");

  const getRouteCompletion = (formNode: any) => {
    let total = 0;
    let answered = 0;
    const walk = (node: any) => {
      for (const child of node.children) {
        if (child.kind === "choice") {
          total += 1;
          const picked = selectedCaseByChoiceId[child.id];
          const pickedOption = child.cases.find((c: any) => c.id === picked);
          if (pickedOption) {
            answered += 1;
            walk(pickedOption);
          }
        }
        if (child.kind === "form") {
          walk(child);
        }
      }
    };
    walk(formNode);
    return { total, answered, complete: total === 0 ? true : total === answered };
  };

  const buildNode = (
    node: EstimationBuilderNode,
    parentId: string | null,
    depth: number
  ): ReportTreeNode => {
      if (node.kind === "const") {
        const bucket = (node.bucket || "misc") as EstimationCostBucket;
        const totals = emptyTotals();
        totals[bucket] = node.value;
        totals.total = node.value;
        return {
          id: node.id,
          label: node.name?.trim() || "Line Item",
          type: "const",
          bucketTotals: totals,
          children: [],
          parentId,
          depth,
          meta: bucketLabel[bucket],
        };
      }

      if (node.kind === "choice") {
        const selectedCaseId = selectedCaseByChoiceId[node.id];
        const selectedCase = node.cases.find((c) => c.id === selectedCaseId);
        const childNodes = selectedCase
          ? [buildNode(selectedCase as EstimationBuilderNode, node.id, depth + 1)]
          : [];

        let totals = emptyTotals();
        childNodes.forEach((child) => {
          totals = addTotals(totals, child.bucketTotals);
        });

        return {
          id: node.id,
          label: node.name || "Choice",
          type: "choice",
          bucketTotals: totals,
          children: childNodes,
          parentId,
          depth,
          meta: selectedCase ? `Selected: ${selectedCase.name}` : "No selection",
        };
      }

      const childNodes = node.children.map((child) =>
        buildNode(child as EstimationBuilderNode, node.id, depth + 1)
      );

      let totals = emptyTotals();
      childNodes.forEach((child) => {
        totals = addTotals(totals, child.bucketTotals);
      });

      return {
        id: node.id,
        label: node.name || "Section",
        type: "form",
        bucketTotals: totals,
        children: childNodes,
        parentId,
        depth,
      };
  };

  const reportTreeRoot = buildNode(
    selectedForm.root as EstimationBuilderNode,
    null,
    0
  );

  const reportNodeById = (() => {
    const map = new Map<string, ReportTreeNode>();
    const walk = (node: ReportTreeNode) => {
      map.set(node.id, node);
      node.children.forEach(walk);
    };
    walk(reportTreeRoot);
    return map;
  })();

  const focusedReportNode = focusedReportNodeId
    ? reportNodeById.get(focusedReportNodeId) || reportTreeRoot
    : reportTreeRoot;

  const graphSourceTotals = focusedReportNode.bucketTotals;
  const finalBase = graphSourceTotals.total;
  const adjustmentTotal = flatAdjustment + (finalBase * percentAdjustment) / 100;
  const finalWithAdjustment = Math.max(0, finalBase + adjustmentTotal);

  const chartData = (() => {
    const rows = (Object.keys(BUCKET_COLORS) as EstimationCostBucket[]).map((bucket) => {
      const base = graphSourceTotals[bucket];
      const weight = finalBase > 0 ? base / finalBase : 0;
      const adjusted = base + adjustmentTotal * weight;
      const min = Math.max(0, adjusted * (1 - variancePct / 100));
      const max = Math.max(0, adjusted * (1 + variancePct / 100));
      return {
        bucket,
        name: bucketLabel[bucket],
        min,
        max,
        value: Math.max(0, adjusted),
      };
    });
    return rows;
  })();

  const maxY = Math.max(1, ...chartData.map((d) => d.max));

  const allowedFocusNodeIds = (() => {
    if (!focusedReportNodeId) return null;
    const allowed = new Set<string>();

    const addDesc = (node: ReportTreeNode) => {
      allowed.add(node.id);
      node.children.forEach(addDesc);
    };

    addDesc(focusedReportNode);

    let cursor: ReportTreeNode | undefined = focusedReportNode;
    while (cursor?.parentId) {
      const p = reportNodeById.get(cursor.parentId);
      if (!p) break;
      allowed.add(p.id);
      cursor = p;
    }

    return allowed;
  })();

  const toggleCollapsed = (nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const treeRow = (node: ReportTreeNode) => {
    const hasChildren = node.children.length > 0;
    const collapsed = collapsedNodeIds.has(node.id);
    const focused = focusedReportNodeId === node.id;
    const activeOpacity =
      !allowedFocusNodeIds || allowedFocusNodeIds.has(node.id) ? 1 : 0.24;

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: activeOpacity, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.16 }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setFocusedReportNodeId(node.id);
          }}
          className={`relative rounded-xl border mb-1.5 px-3 py-2.5 ${clickClass}`}
          style={{
            marginLeft: node.depth * 13,
            background: focused
              ? "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(37,99,235,0.12))"
              : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.88))",
            borderColor: focused
              ? "rgba(14,165,233,0.45)"
              : "rgba(15,23,42,0.1)",
            boxShadow: focused
              ? "0 10px 18px rgba(14,165,233,0.13)"
              : "0 4px 10px rgba(15,23,42,0.05)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <button
              className="h-6 w-6 rounded-md bg-white/85 border border-black/8 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleCollapsed(node.id);
              }}
            >
              {hasChildren ? (
                collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />
              ) : (
                <span className="w-[6px] h-[6px] rounded-full bg-black/30" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] font-[800] truncate">{node.label}</p>
                {node.type === "choice" && (
                  <span className="text-[9px] uppercase tracking-wide px-1.5 py-[1px] rounded-full bg-sky-100 text-sky-700 font-[700]">
                    Choice
                  </span>
                )}
                {node.type === "const" && node.meta && (
                  <span
                    className="text-[9px] uppercase tracking-wide px-1.5 py-[1px] rounded-full font-[700]"
                    style={{
                      color: BUCKET_COLORS[(node.meta.toLowerCase() === "misc" ? "misc" : node.meta.toLowerCase()) as EstimationCostBucket] || BUCKET_COLORS.misc,
                      backgroundColor:
                        BUCKET_BG_COLORS[
                          (node.meta.toLowerCase() === "misc"
                            ? "misc"
                            : node.meta.toLowerCase()) as EstimationCostBucket
                        ] || BUCKET_BG_COLORS.misc,
                    }}
                  >
                    {node.meta}
                  </span>
                )}
              </div>
              {node.meta && node.type !== "const" && (
                <p className="text-[10px] opacity-58 mt-[2px] truncate">{node.meta}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-[12px] font-[800]">{money(node.bucketTotals.total)}</p>
              <div className="flex items-center gap-1 mt-[4px]">
                {(Object.keys(BUCKET_COLORS) as EstimationCostBucket[]).map((bucket) => (
                  <span
                    key={bucket}
                    className="h-[4px] rounded-full"
                    style={{
                      width: `${Math.max(
                        6,
                        node.bucketTotals.total > 0
                          ? (node.bucketTotals[bucket] / node.bucketTotals.total) * 26
                          : 6
                      )}px`,
                      backgroundColor: BUCKET_COLORS[bucket],
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {!collapsed && hasChildren && (
          <div>{node.children.map((child) => treeRow(child))}</div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full h-full px-2.5 py-2.5 overflow-hidden">
      <div
        className="w-full h-full rounded-[20px] border border-black/5 overflow-hidden"
        style={{
          background:
            "radial-gradient(1100px 560px at 0% 0%, rgba(14,165,233,0.11) 0%, rgba(255,255,255,0.92) 36%, rgba(248,250,252,0.98) 100%)",
          boxShadow: "0 12px 32px rgba(15,23,42,0.07)",
        }}
      >
        <div className="h-[calc(100%-0px)] p-3 overflow-y-auto">
          {showResults ? (
            <div className="space-y-3" onClick={() => setFocusedReportNodeId(null)}>
              <div className="rounded-2xl border border-black/8 bg-white/86 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] font-[700] opacity-55">
                      Estimation Dashboard
                    </p>
                    <p className="text-[27px] font-[800] leading-[28px] mt-[2px]">
                      {money(finalWithAdjustment)}
                    </p>
                    <p className="text-[12px] opacity-60 mt-[2px]">
                      Focus: {focusedReportNode.label}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResults(false);
                    }}
                    className={`h-[36px] px-3.5 rounded-lg text-[12px] font-[700] bg-white border border-black/10 flex items-center gap-1.5 ${clickClass}`}
                  >
                    <ArrowLeft size={13} />
                    Return To Form
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(340px,0.86fr)_minmax(520px,1.14fr)] gap-3">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-black/8 bg-white/86 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.08em] font-[700] opacity-55">
                          Bucket Distribution
                        </p>
                        <p className="text-[14px] font-[700] mt-[2px]">{focusedReportNode.label}</p>
                      </div>
                      <BarChart3 size={16} className="opacity-55" />
                    </div>

                    <div className="h-[248px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap={18}>
                          <CartesianGrid strokeDasharray="3 4" opacity={0.2} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, opacity: 0.74 }} axisLine={false} tickLine={false} />
                          <YAxis
                            tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                            tick={{ fontSize: 11, opacity: 0.65 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, maxY]}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(15,23,42,0.03)" }}
                            formatter={(value: any, name: any, ctx: any) => {
                              if (name === "max") return [money(ctx.payload.max), "Max"];
                              if (name === "min") return [money(ctx.payload.min), "Min"];
                              return [money(ctx.payload.value), "Value"];
                            }}
                          />
                          <Bar dataKey="max" fill="rgba(30,41,59,0.15)" radius={[10, 10, 0, 0]} />
                          <Bar dataKey="min" fill="#94A3B8" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {(Object.keys(BUCKET_COLORS) as EstimationCostBucket[]).map((bucket) => {
                        const val = chartData.find((d) => d.bucket === bucket)?.value || 0;
                        return (
                          <div
                            key={bucket}
                            className="rounded-xl px-2.5 py-2"
                            style={{ backgroundColor: BUCKET_BG_COLORS[bucket] }}
                          >
                            <p style={{ color: BUCKET_COLORS[bucket] }} className="text-[10px] font-[700] uppercase tracking-wide">
                              {bucketLabel[bucket]}
                            </p>
                            <p className="text-[12px] font-[800] mt-[2px]">{money(val)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/8 bg-white/86 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <SlidersHorizontal size={14} className="opacity-65" />
                      <p className="text-[11px] uppercase tracking-[0.08em] font-[700] opacity-55">
                        Controls
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <label className="block rounded-xl border border-black/8 bg-white/90 p-2.5">
                        <p className="text-[10px] opacity-60 uppercase tracking-wide">Variability (+/- %)</p>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={variancePct}
                          onChange={(e) => setVariancePct(Number(e.target.value))}
                          className="w-full mt-1.5"
                        />
                        <p className="text-[11px] font-[700] mt-[2px]">{variancePct}%</p>
                      </label>

                      <label className="block rounded-xl border border-black/8 bg-white/90 p-2.5">
                        <p className="text-[10px] opacity-60 uppercase tracking-wide">Markup / Discount (%)</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <GitBranchPlus size={13} className="opacity-55" />
                          <input
                            value={percentAdjustment}
                            onChange={(e) => setPercentAdjustment(Number(e.target.value) || 0)}
                            type="number"
                            className="bg-transparent outline-none text-[13px] font-[700] w-full"
                          />
                          <span className="text-[11px] opacity-65">%</span>
                        </div>
                      </label>

                      <label className="block rounded-xl border border-black/8 bg-white/90 p-2.5">
                        <p className="text-[10px] opacity-60 uppercase tracking-wide">Fees / Constant ($)</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <CircleDollarSign size={13} className="opacity-55" />
                          <input
                            value={flatAdjustment}
                            onChange={(e) => setFlatAdjustment(Number(e.target.value) || 0)}
                            type="number"
                            className="bg-transparent outline-none text-[13px] font-[700] w-full"
                          />
                        </div>
                      </label>

                      <div className="rounded-xl border border-black/8 bg-slate-50/80 p-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="opacity-65">Base</span>
                          <span className="font-[700]">{money(finalBase)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] mt-1">
                          <span className="opacity-65">Adjustments</span>
                          <span className="font-[700]">{money(adjustmentTotal)}</span>
                        </div>
                        <div className="h-px bg-black/10 my-2" />
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-[700]">Final</span>
                          <span className="font-[800]">{money(finalWithAdjustment)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/8 bg-white/86 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] font-[700] opacity-55">
                        Routed Cost Tree
                      </p>
                      <p className="text-[13px] font-[700] mt-[2px]">
                        Click a row to focus chart + dim unrelated branches
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollapsedNodeIds(new Set());
                        }}
                        className={`h-[30px] px-2.5 rounded-md bg-white border border-black/10 text-[11px] font-[700] ${clickClass}`}
                      >
                        Expand All
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusedReportNodeId(null);
                        }}
                        className={`h-[30px] px-2.5 rounded-md bg-white border border-black/10 text-[11px] font-[700] ${clickClass}`}
                      >
                        Reset Focus
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[760px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>{[treeRow(reportTreeRoot)]}</AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              <div
                className="rounded-2xl border p-3.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,249,255,0.88))",
                  borderColor: runComplete
                    ? "rgba(34,197,94,0.32)"
                    : "rgba(239,68,68,0.26)",
                  boxShadow: runComplete
                    ? "0 10px 24px rgba(34,197,94,0.14)"
                    : "0 10px 24px rgba(239,68,68,0.10)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <button
                      onClick={onNavigateUp}
                      disabled={!canGoBack}
                      className={`h-[38px] px-3.5 rounded-xl border text-[12px] font-[800] flex items-center gap-1.5 ${clickClass}`}
                      style={{
                        background: canGoBack
                          ? "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))"
                          : "rgba(248,250,252,0.6)",
                        borderColor: canGoBack
                          ? "rgba(14,165,233,0.28)"
                          : "rgba(148,163,184,0.28)",
                        color: canGoBack ? "#0369A1" : "rgba(100,116,139,0.7)",
                        cursor: canGoBack ? "pointer" : "not-allowed",
                      }}
                    >
                      <ArrowLeft size={15} />
                      Back
                    </button>

                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.08em] font-[700] opacity-55">
                        Current Section
                      </p>
                      <p className="text-[20px] font-[800] leading-[22px] truncate">
                        {currentSectionName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="h-[34px] px-3 rounded-lg text-[11px] font-[700] flex items-center gap-1.5"
                      style={{
                        backgroundColor: completionForActiveForm.complete
                          ? "rgba(6,155,90,0.14)"
                          : "rgba(239,68,68,0.13)",
                        color: completionForActiveForm.complete
                          ? "rgb(6,155,90)"
                          : "rgb(185,28,28)",
                      }}
                    >
                      {completionForActiveForm.complete ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <XCircle size={13} />
                      )}
                      {completionForActiveForm.answeredChoices}/
                      {completionForActiveForm.totalChoices || 0} routed
                    </div>

                    <button
                      onClick={onResetCurrentRun}
                      className={`h-[36px] px-3.5 rounded-lg text-[12px] font-[700] flex items-center gap-1.5 ${clickClass}`}
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(241,245,249,0.96) 0%, rgba(226,232,240,0.96) 100%)",
                        color: "#334155",
                        border: "1px solid rgba(148,163,184,0.38)",
                      }}
                    >
                      <RotateCcw size={13} />
                      Reset
                    </button>

                    {runComplete && (
                      <button
                        onClick={onRunEstimation}
                        className={`h-[36px] px-3.5 rounded-lg text-[12px] font-[700] flex items-center gap-1.5 ${clickClass}`}
                        style={{
                          background:
                            "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
                          color: "white",
                        }}
                      >
                        <Play size={13} />
                        Run Estimation
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {(activeFormNode?.children || []).map((child) => {
                    if (child.kind === "form") {
                      const constOnly = isConstOnlyForm(child);
                      const clickable = hasNonConstChildren(child);
                      const route = getRouteCompletion(child);
                      return (
                        <motion.button
                          key={child.id}
                          onClick={() => clickable && onNavigateToFormNode(child.id)}
                          disabled={!clickable}
                          className={`w-full rounded-xl border border-black/8 bg-white/92 px-3 py-2.5 text-left flex items-center justify-between ${clickClass}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            borderColor: route.complete
                              ? "rgba(34,197,94,0.38)"
                              : "rgba(239,68,68,0.25)",
                            boxShadow: route.complete
                              ? "0 8px 18px rgba(34,197,94,0.13)"
                              : "0 8px 18px rgba(239,68,68,0.09)",
                            opacity: constOnly ? 0.62 : 1,
                            cursor: clickable ? "pointer" : "default",
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center"
                              style={{
                                background: route.complete
                                  ? "rgba(34,197,94,0.12)"
                                  : "rgba(239,68,68,0.12)",
                                color: route.complete
                                  ? "rgb(22,163,74)"
                                  : "rgb(220,38,38)",
                              }}
                            >
                              <FolderTree size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-[700] leading-tight">{child.name}</p>
                              <p className="text-[10px] opacity-58 mt-[3px]">
                                {constOnly
                                  ? "CONSTANT"
                                  : `${route.answered}/${route.total} choices completed`}
                              </p>
                            </div>
                          </div>
                          {!constOnly && <ChevronRight size={14} className="opacity-55" />}
                        </motion.button>
                      );
                    }

                    if (child.kind === "choice") {
                      const selectedCaseId = selectedCaseByChoiceId[child.id];
                      const selectedOption = child.cases.find((c) => c.id === selectedCaseId);
                      const selectedCompletion = selectedOption
                        ? getRouteCompletion(selectedOption)
                        : null;
                      const needsAttention =
                        !selectedOption || (selectedCompletion && !selectedCompletion.complete);
                      const canNavigateIntoSelected =
                        !!selectedOption && hasInteractiveRoute(selectedOption);
                      return (
                        <motion.div
                          key={child.id}
                          className="rounded-xl border px-3 py-2.5"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            background: needsAttention
                              ? "linear-gradient(180deg, rgba(254,242,242,0.86), rgba(255,255,255,0.95))"
                              : "linear-gradient(180deg, rgba(240,253,244,0.85), rgba(255,255,255,0.95))",
                            borderColor: needsAttention
                              ? "rgba(239,68,68,0.30)"
                              : "rgba(34,197,94,0.34)",
                            boxShadow: needsAttention
                              ? "0 8px 20px rgba(239,68,68,0.09)"
                              : "0 8px 20px rgba(34,197,94,0.10)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="h-8 w-8 rounded-lg flex items-center justify-center"
                                style={{
                                  backgroundColor: needsAttention
                                    ? "rgba(239,68,68,0.12)"
                                    : "rgba(22,163,74,0.12)",
                                  color: needsAttention
                                    ? "rgb(220,38,38)"
                                    : "rgb(22,163,74)",
                                }}
                              >
                                <Route size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-[700] leading-tight">{child.name}</p>
                                <p className="text-[10px] opacity-58 mt-[3px]">Choose one option</p>
                              </div>
                            </div>
                            {selectedOption && canNavigateIntoSelected && (
                              <button
                                onClick={() => onNavigateToFormNode(selectedOption.id)}
                                className={`h-[30px] px-2.5 rounded-md border bg-white/95 flex items-center justify-center gap-1 text-[10.5px] font-[700] ${clickClass}`}
                                style={{ borderColor: "rgba(15,23,42,0.12)" }}
                                title="Open selected option details"
                              >
                                Continue
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {child.cases.map((option) => {
                              const selected = option.id === selectedCaseId;
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => onChooseCase(child.id, option.id)}
                                  className={`h-[29px] px-2.5 rounded-md border text-[11px] font-[700] ${clickClass}`}
                                  style={{
                                    backgroundColor: selected
                                      ? "rgba(14,165,233,0.14)"
                                      : "rgba(255,255,255,0.95)",
                                    borderColor: selected
                                      ? "rgba(14,165,233,0.38)"
                                      : "rgba(15,23,42,0.12)",
                                    color: selected ? "#0369A1" : "inherit",
                                  }}
                                >
                                  {option.name}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    }

                    return null;
                  })}
                </AnimatePresence>

                {!activeFormNode?.children?.some((child) => child.kind !== "const") && (
                  <div className="rounded-xl border border-black/8 bg-white/86 px-3 py-3 text-[11px] opacity-70">
                    {activeFormNode?.children?.length
                      ? "This section is CONSTANT."
                      : "This section has no children."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
