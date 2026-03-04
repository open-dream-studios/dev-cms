"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { getCardStyle, getInnerCardStyle } from "@/styles/themeStyles";

function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export default function EstimationCompleted({
  pricing,
  breakdown,
  onBack,
  onLeave,
}: any) {
  const { currentUser } = useContext(AuthContext);
  const theme = useCurrentTheme();
  if (!currentUser) return null;

  const chartData = breakdown.map((b: any) => ({
    name: b.label,
    min: Math.round(b.min_cost),
    max: Math.round(b.max_cost),
  }));

  const maxY = Math.max(...chartData.map((d: any) => d.max));
  const totalMax = pricing.total_max;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-5 pt-5 pb-10 space-y-4">
      {/* HEADER */}
      <div
        className="rounded-2xl px-5 py-[14px]"
        style={getCardStyle(currentUser.theme, theme)}
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[13px] opacity-60">Estimated Project Cost</div>
            <div className="text-[28px] font-semibold">
              {money(pricing.total_min)} – {money(pricing.total_max)}
            </div>
            <div className="text-[14px] opacity-70 capitalize">
              Tier: {pricing.inferred_tier}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="px-5 py-2 rounded-[10px]"
              style={getInnerCardStyle(currentUser.theme, theme)}
            >
              Back
            </button>
            <button
              onClick={onLeave}
              className="px-5 py-2 rounded-[10px]"
              style={{ background: theme.app_color_1, color: theme.text_1 }}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div
        className="rounded-2xl px-5 py-4 w-full md:max-w-[50%]"
        style={getCardStyle(currentUser.theme, theme)}
      >
        <div className="mb-3">
          <div className="text-[13px] opacity-60">Cost distribution</div>
          <div className="text-[18px] font-semibold">Breakdown by category</div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <div className="w-[100%] h-[100%] relative">
              <div className="w-[100%] h-[100%] absolute left-0 top-0">
                <BarChart
                  data={chartData}
                  tabIndex={-1}
                  style={{ outline: "none" }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, opacity: 0.75 }}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v / 1000}k`}
                    tick={{
                      opacity: 0.75,
                    }}
                    domain={[0, maxY]}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    formatter={(_: any, __: any, ctx: any) =>
                      `${money(ctx.payload.min)} – ${money(ctx.payload.max)}`
                    }
                  />

                  {/* BACK BAR — MAX */}
                  <Bar
                    dataKey="max"
                    fill="#7c3aed"
                    radius={[10, 10, 0, 0]}
                    opacity={0.45}
                  />
                </BarChart>
              </div>

              <div className="w-[100%] h-[100%] absolute left-0 top-0">
                <BarChart
                  data={chartData}
                  tabIndex={-1}
                  style={{ outline: "none" }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12, opacity: 0 }} />
                  <YAxis
                    tickFormatter={(v) => `$${v / 1000}k`}
                    tick={{ opacity: 0 }}
                    domain={[0, maxY]}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    formatter={(_: any, __: any, ctx: any) =>
                      `${money(ctx.payload.min)} – ${money(ctx.payload.max)}`
                    }
                  />

                  {/* FRONT BAR — MIN */}
                  <Bar
                    dataKey="min"
                    fill="#06b6d4"
                    radius={[10, 10, 0, 0]}
                    className="brightness-97"
                  />
                </BarChart>
              </div>
            </div>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breakdown.map((item: any) => {
          const maxPct = Math.min(100, (item.max_cost / totalMax) * 100);
          const minPct = Math.min(100, (item.min_cost / totalMax) * 100);

          return (
            <div
              key={item.label}
              className="rounded-2xl p-4 space-y-3"
              style={getInnerCardStyle(currentUser.theme, theme)}
            >
              {/* HEADER */}
              <div>
                <div className="text-[13px] opacity-60">{item.category}</div>
                <div className="text-[16px] font-semibold">{item.label}</div>
                <div className="flex flex-row justify-between items-end">
                  <div className="text-[18px] font-semibold mt-1">
                    {money(item.min_cost)} – {money(item.max_cost)}
                  </div>

                  <div className="text-[11px] opacity-50 text-right mb-[-3px]">
                    {Math.round(minPct)}–{Math.round(maxPct)}% of total
                  </div>
                </div>
              </div>

              {/* RANGE BAR */}
              <div
                className="relative w-full h-[5px] rounded-full overflow-hidden"
                style={{ background: "rgba(0,0,0,0.25)" }}
              >
                {/* PURPLE — MAX */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${maxPct}%`,
                    background: "#7c3aed",
                    opacity: 0.45,
                  }}
                />

                {/* BLUE — MIN */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full brightness-88"
                  style={{
                    width: `${minPct}%`,
                    background: "#06b6d4",
                  }}
                />
              </div>

              {/* EXPLANATIONS */}
              <div className="flex flex-col mt-[2px] gap-[4px]">
                {item.explanations?.map((e: string) => (
                  <div key={e} className="text-[13px] opacity-65 leading-snug">
                    • {e}
                  </div>
                ))}
              </div>

              {/* FACTS */}
              {item.calculation && (
                <div className="pt-[4px] text-[11px] opacity-55 space-y-0.5">
                  {Object.entries(item.calculation.applied_facts || {}).map(
                    ([k, v]) => (
                      <div key={k}>
                        {k}: <span className="font-medium">{String(v)}</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
