// project/src/modules/DashboardModule/components/GoogleAdsAside.tsx
import { useCurrentTheme } from "@/hooks/useTheme";
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency, formatInt } from "./data";
import { Zap } from "lucide-react";
import { useGoogleDataStore } from "../../_googleStore";

const GoogleAdsAside = () => {
  const currentTheme = useCurrentTheme();

  const {
    googleAdsData,
    currentGoogleAdsRange,
    selectedAdGroupId,
    setSelectedAdGroupId,
  } = useGoogleDataStore();

  const data = googleAdsData.status === "success" ? googleAdsData.data : null;

  const statsForRange = useMemo(() => {
    if (!data || !data.stats) return [];
    const stats = data.stats as any[];
    let count = 30;
    if (currentGoogleAdsRange === "7d") count = 7;
    if (currentGoogleAdsRange === "30d") count = 30;
    if (currentGoogleAdsRange === "90d") count = 90;
    // if (range === "365d") count = stats.length;
    // always take the last `count` entries
    return stats.slice(Math.max(0, stats.length - count));
  }, [data, currentGoogleAdsRange]);

  const aggregated = useMemo(() => {
    const s = statsForRange;
    const totalSpend = s.reduce(
      (acc: number, r: any) => acc + (r.spend || 0),
      0
    );
    const totalImpressions = s.reduce(
      (acc: number, r: any) => acc + (r.impressions || 0),
      0
    );
    const totalClicks = s.reduce(
      (acc: number, r: any) => acc + (r.clicks || 0),
      0
    );
    const totalConversions = s.reduce(
      (acc: number, r: any) => acc + (r.conversions || 0),
      0
    );
    const cpa =
      totalConversions > 0 ? totalSpend / totalConversions : totalSpend;
    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    return {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      cpa,
      ctr,
      cpc,
    };
  }, [statsForRange]);

  const adGroups = data?.adGroups ?? [];

  return (
    <div>
      <aside className="col-span-4 flex flex-col gap-4 rounded-2xl">
        <div
          className="rounded-2xl p-4"
          style={{ background: currentTheme.cardBackground }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">Overview</div>
            <div className="text-xs text-slate-400">Real-time</div>
          </div>

          <div style={{ height: 160 }} className="mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Organic",
                      value: aggregated.totalImpressions || 0,
                    },
                    {
                      name: "Paid",
                      value: Math.max(1, aggregated.totalImpressions || 0),
                    },
                  ]}
                  dataKey="value"
                  innerRadius={36}
                  outerRadius={64}
                  paddingAngle={3}
                >
                  <Cell fill="#22d3ee" />
                  <Cell fill="#7c3aed" />
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm ">
            <div className="flex items-center gap-2">
              <div
                style={{ background: "#22d3ee" }}
                className="w-3 h-3 rounded-sm"
              />
              <div style={{ color: currentTheme.text_2 }}>Spend</div>
              <div
                style={{ color: currentTheme.text_2 }}
                className="ml-auto font-semibold"
              >
                {formatCurrency(aggregated.totalSpend || 0)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{ background: "#7c3aed" }}
                className="w-3 h-3 rounded-sm"
              />
              <div style={{ color: currentTheme.text_2 }}>Impr</div>
              <div
                style={{ color: currentTheme.text_2 }}
                className="ml-auto font-semibold"
              >
                {formatInt(aggregated.totalImpressions || 0)}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: currentTheme.cardBackground }}
        >
          <div className="p-2 rounded-lg bg-white/5">
            <Zap color={currentTheme.text_2} />
          </div>
          <div>
            <div style={{ color: currentTheme.text_2 }} className="text-xs">
              AI Suggestion
            </div>
            <div
              style={{ color: currentTheme.text_2 }}
              className="font-semibold"
            >
              Shift 10% budget to top-performing video during weekends
            </div>
          </div>
          <div className="ml-auto">
            <button className="px-3 py-1 rounded-md bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white text-sm">
              Apply
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ background: currentTheme.cardBackground }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">Ad Groups</div>
            <div className="text-xs text-slate-400">Switch</div>
          </div>
          <div className="space-y-2">
            {(adGroups || []).map((g: any) => (
              <button
                key={g.id}
                onClick={() => setSelectedAdGroupId(g.id)}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  selectedAdGroupId === g.id ? "shadow-md" : ""
                }`}
                style={{
                  background:
                    selectedAdGroupId === g.id
                      ? "linear-gradient(90deg,#06b6d4,#7c3aed)"
                      : currentTheme.background_2,
                  color:
                    selectedAdGroupId === g.id ? "#fff" : currentTheme.text_1,
                }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default GoogleAdsAside;
