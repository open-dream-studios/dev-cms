// project/src/modules/EstimationFormsModule/components/EstimationFormRunsSidebar.tsx
"use client";

import { useMemo } from "react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  Check,
  ChevronRight,
  FileInput,
  PanelLeftClose,
  Search,
} from "lucide-react";
import { useEstimationFormRunsModule } from "../_hooks/estimationFormRuns.hooks";
import { useEstimationFormRunsUIStore } from "../_store/estimationFormRuns.store";

const clickClass =
  "cursor-pointer dim hover:brightness-[80%] transition-all duration-200";

export default function EstimationFormRunsSidebar({ mini }: { mini: boolean }) {
  const currentTheme = useCurrentTheme();
  const { filteredForms, selectedForm, search, setSearch, onSelectRunnableForm } =
    useEstimationFormRunsModule();
  const { estimationFormRunsLeftBarOpen, setEstimationFormRunsLeftBarOpen } =
    useEstimationFormRunsUIStore();

  const completionMap = useMemo(() => {
    const map = new Map<string, string>();
    filteredForms.forEach((form) => {
      map.set(form.id, "Published");
    });
    return map;
  }, [filteredForms]);

  if (mini) {
    return (
      <div
        className="w-[56px] h-full flex flex-col items-center py-3 gap-2"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 100%)",
          borderRight: `1px solid ${currentTheme.background_2}`,
        }}
      >
        <button
          onClick={() =>
            setEstimationFormRunsLeftBarOpen(!estimationFormRunsLeftBarOpen)
          }
          style={{
            backgroundColor: currentTheme.background_1_3,
            border: "1px solid" + currentTheme.background_1_2,
            color: currentTheme.text_3,
          }}
          className={`h-[34px] w-[34px] mt-[2px] mb-[-2px] flex justify-center items-center rounded-lg ${clickClass}`}
          title="Expand Sidebar"
        >
          <ChevronRight size={16} className="opacity-85" />
        </button>

        <div className="w-[30px] h-[1px] bg-black/10 mt-[6px] mb-[4px]" />

        <div className="w-full flex flex-col items-center gap-1.5 overflow-y-auto pb-2">
          {filteredForms.slice(0, 12).map((form) => {
            const selected = selectedForm?.id === form.id;
            const label = (form.name || "F").trim().slice(0, 2).toUpperCase();

            return (
              <button
                key={form.id}
                onClick={() => onSelectRunnableForm(form.id)}
                className={`h-[34px] w-[34px] rounded-lg border text-[10px] font-[700] flex items-center justify-center ${clickClass}`}
                style={{
                  backgroundColor: selected
                    ? "rgba(14, 165, 233, 0.16)"
                    : "rgba(255,255,255,0.86)",
                  borderColor: selected
                    ? "rgba(14,165,233,0.35)"
                    : "rgba(15,23,42,0.12)",
                  color: selected ? "#0369A1" : "#334155",
                }}
                title={form.name}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[252px] h-full flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)",
        borderRight: `1px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="px-3.5 pt-3 pb-2.5 border-b border-black/5">
        <div className="flex items-center justify-between">
          <div className="pl-[1px]">
            <p className="text-[15px] font-[700]">Estimation Runs</p>
            <p className="pl-[0.4px] text-[10px] opacity-60 mt-[-0.8px]">
              Published Forms
            </p>
          </div>

          <button
            onClick={() =>
              setEstimationFormRunsLeftBarOpen(!estimationFormRunsLeftBarOpen)
            }
            style={{
              backgroundColor: currentTheme.background_1_3,
              color: currentTheme.text_3,
            }}
            className={`h-[33px] w-[33px] pr-[1px] pb-[1px] flex justify-center items-center rounded-lg ${clickClass}`}
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={17} className="opacity-88" />
          </button>
        </div>

        <div
          className="mt-2.5 h-8 rounded-lg px-2.5 flex items-center gap-2"
          style={{ backgroundColor: currentTheme.background_1_3 }}
        >
          <Search size={13} className="opacity-55" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search published forms..."
            className="bg-transparent outline-none w-full text-[11px]"
          />
        </div>
      </div>

      <div className="p-2 flex-1 overflow-y-auto">
        {filteredForms.map((form) => {
          const selected = selectedForm?.id === form.id;
          return (
            <button
              key={form.id}
              onClick={() => onSelectRunnableForm(form.id)}
              className={`mb-2 rounded-xl p-0 group overflow-hidden w-full text-left ${clickClass}`}
              style={{
                backgroundColor: selected
                  ? "rgba(14, 165, 233, 0.11)"
                  : "rgba(255,255,255,0.86)",
                border: selected
                  ? "1px solid rgba(14, 165, 233, 0.32)"
                  : "1px solid rgba(15,23,42,0.09)",
                boxShadow: selected
                  ? "0 8px 18px rgba(14,165,233,0.12)"
                  : "0 4px 14px rgba(15,23,42,0.045)",
              }}
            >
              <div className="flex min-h-[74px] w-full">
                <div
                  className="w-[4px] shrink-0"
                  style={{
                    background: selected
                      ? "linear-gradient(180deg, rgba(14,165,233,0.42) 0%, rgba(37,99,235,0.42) 100%)"
                      : "linear-gradient(180deg, rgba(148,163,184,0.32) 0%, rgba(148,163,184,0.18) 100%)",
                  }}
                />

                <div className="flex-1 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13.2px] leading-[18px] font-[700] truncate w-full">
                        {form.name}
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.08em] font-[700] opacity-55 mt-[5px]">
                        {completionMap.get(form.id)}
                      </p>
                    </div>
                    <div className="h-[26px] w-[26px] rounded-md bg-white/85 flex items-center justify-center text-sky-700">
                      <FileInput size={12} />
                    </div>
                  </div>

                  {/* {!!form.description && (
                    <p className="text-[10.5px] mt-[6px] opacity-60 leading-tight line-clamp-2">
                      {form.description}
                    </p>
                  )} */}

                  <div className="mt-[8px] flex items-center gap-1.5 text-[10px] opacity-70">
                    <Check size={11} className="text-[rgb(6,155,90)]" />
                    <span>Runnable</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
