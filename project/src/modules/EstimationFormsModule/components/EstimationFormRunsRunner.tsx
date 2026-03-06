// project/src/modules/EstimationFormsModule/components/EstimationFormRunsRunner.tsx
"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDashed,
  CircleDollarSign,
  Eye,
  FolderTree,
  GitBranchPlus,
  Layers3,
  Play,
  Route,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEstimationFormRunsModule } from "../_hooks/estimationFormRuns.hooks";

const clickClass =
  "cursor-pointer dim hover:brightness-[80%] transition-all duration-200";

export default function EstimationFormRunsRunner() {
  const {
    selectedForm,
    activeFormNode,
    selectedCaseByChoiceId,
    runComplete,
    runResult,
    completionForActiveForm,
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
    formatMoney,
  } = useEstimationFormRunsModule();

  if (!selectedForm) {
    return (
      <div className="w-full h-full p-4">
        <div className="w-full h-full rounded-2xl border border-black/8 bg-white/65 flex items-center justify-center text-sm opacity-70">
          No published, valid forms available to run.
        </div>
      </div>
    );
  }

  const currentSectionName =
    activeFormNode?.id === selectedForm.root.id
      ? selectedForm.name
      : activeFormNode?.name || selectedForm.name;
  const canGoBack = !!activeFormNode && activeFormNode.id !== selectedForm.root.id;

  const hasInteractiveRoute = (formNode: (typeof selectedForm.root)["children"][number] & { kind: "form" } | typeof selectedForm.root) => {
    const walk = (node: typeof formNode): boolean => {
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

  const getRouteCompletion = (formNode: (typeof selectedForm.root)["children"][number] & { kind: "form" } | typeof selectedForm.root) => {
    let total = 0;
    let answered = 0;
    const walk = (node: typeof formNode) => {
      for (const child of node.children) {
        if (child.kind === "choice") {
          total += 1;
          const picked = selectedCaseByChoiceId[child.id];
          const pickedOption = child.cases.find((c) => c.id === picked);
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

  return (
    <div className="w-full h-full px-2.5 py-2.5 overflow-hidden">
      <div
        className="w-full h-full rounded-[20px] border border-black/5 overflow-hidden"
        style={{
          background:
            "radial-gradient(1200px 500px at 0% 0%, rgba(14,165,233,0.11) 0%, rgba(255,255,255,0.9) 34%, rgba(248,250,252,0.96) 100%)",
          boxShadow: "0 12px 32px rgba(15,23,42,0.07)",
        }}
      >
        <div className="h-[62px] px-4 border-b border-black/5 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] font-[700] opacity-55">
              Estimation Run
            </div>
            <div className="text-[18px] font-[700] leading-[20px] truncate">
              {selectedForm.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="h-[32px] px-3 rounded-lg text-[11px] font-[700] flex items-center gap-1.5"
              style={{
                backgroundColor: runComplete
                  ? "rgba(6, 155, 90, 0.12)"
                  : "rgba(148,163,184,0.16)",
                color: runComplete ? "rgb(6, 155, 90)" : "rgb(71,85,105)",
              }}
            >
              {runComplete ? <Check size={12} /> : <Circle size={11} />}
              {runComplete ? "Complete" : "Incomplete"}
            </div>

            {runComplete && (
              <button
                onClick={onRunEstimation}
                className={`h-[36px] px-3.5 rounded-lg text-[12px] font-[700] flex items-center gap-1.5 ${clickClass}`}
                style={{
                  background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
                  color: "white",
                }}
              >
                <Play size={13} />
                Run Estimation
              </button>
            )}
          </div>
        </div>

        <div className="h-[calc(100%-62px)] p-3 overflow-y-auto">
            {showResults && runResult ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-black/7 bg-white/80 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] opacity-55 font-[700]">
                        Estimation Result
                      </div>
                      <div className="text-[29px] font-[700] leading-[31px] mt-[2px]">
                        {formatMoney(runResult.final_total)}
                      </div>
                      <div className="text-[12px] opacity-60 mt-[2px]">
                        Base {formatMoney(runResult.base_total)}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowResults(false)}
                      className={`h-[34px] px-3 rounded-lg text-[12px] font-[700] bg-white/90 border border-black/8 flex items-center gap-1.5 ${clickClass}`}
                    >
                      <Eye size={12} />
                      Back To Form
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <label className="rounded-xl border border-black/8 bg-white/90 p-2.5">
                      <p className="text-[10px] opacity-60 uppercase tracking-wide">Flat Adjustment</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <CircleDollarSign size={14} className="opacity-60" />
                        <input
                          value={flatAdjustment}
                          onChange={(e) => setFlatAdjustment(Number(e.target.value) || 0)}
                          type="number"
                          className="bg-transparent outline-none text-[13px] font-[700] w-full"
                        />
                      </div>
                    </label>

                    <label className="rounded-xl border border-black/8 bg-white/90 p-2.5">
                      <p className="text-[10px] opacity-60 uppercase tracking-wide">Percent Adjustment</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <GitBranchPlus size={14} className="opacity-60" />
                        <input
                          value={percentAdjustment}
                          onChange={(e) => setPercentAdjustment(Number(e.target.value) || 0)}
                          type="number"
                          className="bg-transparent outline-none text-[13px] font-[700] w-full"
                        />
                        <span className="text-[11px] opacity-65">%</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/7 bg-white/80 p-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] opacity-55 font-[700] mb-3">
                    Section Totals
                  </div>

                  <div className="space-y-2.5">
                    {runResult.sections
                      .slice()
                      .sort((a, b) => a.depth - b.depth)
                      .map((section) => {
                        const pct =
                          runResult.base_total > 0
                            ? Math.min(100, (section.subtotal / runResult.base_total) * 100)
                            : 0;
                        return (
                          <div
                            key={section.form_id}
                            className="rounded-xl border border-black/8 bg-white/90 p-3"
                            style={{ marginLeft: section.depth * 10 }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-[700] truncate">{section.label}</p>
                              <p className="text-[12px] font-[700]">{formatMoney(section.subtotal)}</p>
                            </div>
                            <div className="mt-2 h-[6px] rounded-full bg-black/8 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background:
                                    "linear-gradient(90deg, rgba(14,165,233,0.9), rgba(37,99,235,0.85))",
                                }}
                              />
                            </div>
                            {!!section.line_items.length && (
                              <div className="mt-2.5 space-y-1">
                                {section.line_items.map((line) => (
                                  <div
                                    key={line.id}
                                    className="flex items-center justify-between text-[11px] opacity-75"
                                  >
                                    <span>{line.label}</span>
                                    <span>{formatMoney(line.value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <AnimatePresence initial={false} mode="popLayout">
                    {(activeFormNode?.children || []).map((child) => {
                    if (child.kind === "form") {
                      const route = getRouteCompletion(child);
                      return (
                        <motion.button
                          key={child.id}
                          onClick={() => onNavigateToFormNode(child.id)}
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
                                {route.answered}/{route.total} choices completed
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="opacity-55" />
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
                                className={`h-[29px] w-[29px] rounded-md border bg-white/95 flex items-center justify-center ${clickClass}`}
                                style={{ borderColor: "rgba(15,23,42,0.12)" }}
                                title="Open selected option details"
                              >
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

                    return (
                      <motion.div
                        key={child.id}
                        className="rounded-xl border border-black/8 bg-white/70 px-3 py-2.5 opacity-[0.62] flex items-center justify-between"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 0.62, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        <div className="flex items-center gap-2">
                          <Layers3 size={13} />
                          <div>
                            <p className="text-[12px] font-[700]">{child.name || "Line Item"}</p>
                            <p className="text-[10px] mt-[3px]">Leaf Item</p>
                          </div>
                        </div>
                        <CircleDashed size={13} />
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>

                  {!activeFormNode?.children?.length && (
                    <div className="rounded-xl border border-black/8 bg-white/86 px-3 py-3 text-[11px] opacity-70">
                      This section has no children.
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
