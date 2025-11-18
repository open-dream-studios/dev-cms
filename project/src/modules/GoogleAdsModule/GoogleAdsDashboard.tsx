// project/src/modules/GoogleAdsModule/GoogleAdsDashboard.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  Search,
  Activity,
  DollarSign,
  Users,
  BarChart2,
  RefreshCw,
  Zap,
  Play,
  MapPin,
  Calendar,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Image from "next/image";
import { formatPhone } from "@/util/functions/Customers";
import savedData from "./data.json";

export const CAMPAIGN_TYPE_MAP = {
  0: "UNSPECIFIED",
  1: "UNKNOWN",
  2: "SEARCH",
  3: "DISPLAY",
  4: "SHOPPING",
  5: "HOTEL",
  6: "VIDEO",
  7: "APP",
  8: "LOCAL",
  9: "SMART",
  10: "PERFORMANCE_MAX",
  11: "LOCAL_SERVICES",
  12: "DISCOVERY",
  13: "TRAVEL",
} as const;

// -------------------- Helper: small formatters -----------------------------
function formatCurrency(n: number) {
  if (isNaN(n)) return "$0";
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function formatInt(n: number) {
  if (!n && n !== 0) return "0";
  return n.toLocaleString();
}
function percent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

// -------------------- Skeletons (simple) ---------------------------------
const SkeletonBox: React.FC<{
  height?: string | number;
  width?: string | number;
  className?: string;
}> = ({ height = 20, width = "100%", className = "" }) => (
  <div
    className={`animate-pulse bg-white/6 rounded-md ${className}`}
    style={{ height, width }}
  />
);

// -------------------- Presentational components (pure) --------------------
// NOTE: these should not hold business logic; only receive props.

const MetricCard: React.FC<{
  title: string;
  value: React.ReactNode;
  delta?: number;
  icon?: React.ReactNode;
  loading?: boolean;
  theme: any;
}> = ({ title, value, delta = 0, icon, loading = false, theme }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={
        "cursor-pointer dim border border-white/6 rounded-2xl p-4 shadow-2xl backdrop-blur-sm"
      }
      style={{
        background: theme.cardBackground,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-[100%] flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: theme.background_3,
            }}
          >
            {icon}
          </div>
          <div className="w-[100%] h-[100%]">
            <div className="flex flex-row justify-between w-[100%]">
              <div className="text-sm" style={{ color: theme.text_2 }}>
                {title}
              </div>
              <div
                className={`text-sm ${
                  delta >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {delta >= 0 ? `▲ ${delta}%` : `▼ ${Math.abs(delta)}%`}
              </div>
            </div>
            <div
              className="text-2xl font-semibold mt-1"
              style={{ color: theme.text_1 }}
            >
              {loading ? <SkeletonBox height={28} width={120} /> : value}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MiniArea: React.FC<{ data: any[]; dataKey: string; color?: string }> = ({
  data,
  dataKey,
  color = "#06b6d4",
}) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`mini-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        fill={`url(#mini-${dataKey})`}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const MetricToggle: React.FC<{
  options: { key: string; label: string }[];
  active: string[];
  onToggle: (k: string) => void;
  theme: any;
}> = ({ options, active, onToggle, theme }) => (
  <div className="flex items-center gap-2">
    {options.map((o) => {
      const isActive = active.includes(o.key);
      return (
        <button
          key={o.key}
          onClick={() => onToggle(o.key)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            isActive ? "shadow-md" : "opacity-80"
          }`}
          style={{
            background: isActive
              ? "linear-gradient(90deg,#06b6d4,#7c3aed)"
              : theme.background_2,
            color: isActive ? "#fff" : theme.text_1,
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

const TopAssetsTable: React.FC<{
  title: string;
  rows: any[];
  columns: string[];
  theme: any;
}> = ({ title, rows, columns, theme }) => {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: theme.cardBackground }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm" style={{ color: theme.text_2 }}>
          {title}
        </div>
        <div className="text-xs text-slate-400">Snapshot</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b" style={{ color: theme.text_2 }}>
            <tr>
              {columns.map((c) => (
                <th key={c} className="py-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b" style={{ color: theme.text_2 }}>
                {columns.map((c) => (
                  <td key={c} className="py-3">
                    {r[c] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-4 text-center text-slate-400"
                >
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Chart tooltip
const AdsTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="p-2 rounded-md"
      style={{ background: "#0b1220", color: "#e6eef8" }}
    >
      <div className="text-xs mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-sm">
          <span style={{ color: p.color }}>{p.name}: </span>
          <strong>
            {p.dataKey === "spend"
              ? formatCurrency(p.value)
              : formatInt(p.value)}
          </strong>
        </div>
      ))}
    </div>
  );
};

// -------------------- Campaign Top Bar (new) -----------------------------
const CampaignTopBar: React.FC<{
  data: any | null;
  currentProject: any;
  theme: any;
  activeCampaignId: number | null;
  setActiveCampaignId: (id: number | null) => void;
  showCampaignPicker: boolean;
  setShowCampaignPicker: (v: boolean) => void;
  onSaveBudget: (campaignId: number | null, newBudget: number) => Promise<void>;
}> = ({
  data,
  currentProject,
  theme,
  activeCampaignId,
  setActiveCampaignId,
  showCampaignPicker,
  setShowCampaignPicker,
  onSaveBudget,
}) => {
  const [editingBudget, setEditingBudget] = useState(false);
  const [editedBudgetValue, setEditedBudgetValue] = useState<string>("");
  const currentTheme = useCurrentTheme();
  const budgetInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus();
    }
  }, [editingBudget]);

  const campaignsList: any[] =
    (data?.campaigns && Array.isArray(data.campaigns.campaigns)
      ? data.campaigns.campaigns
      : data?.campaigns ?? []) || [];

  const activeCampaign =
    campaignsList.find((c) => String(c.id) === String(activeCampaignId)) ??
    data?.activeCampaign ??
    null;

  const displayBudget = activeCampaign?.budget ?? 10; // fallback

  const handleSetBudget = async () => {
    const normalized = editedBudgetValue === "" ? "0" : editedBudgetValue;
    const parsed = Number(normalized);
    if (activeCampaign && activeCampaign.id) {
      console.log(activeCampaign.id, parsed)
      await onSaveBudget(activeCampaign.id, parsed);
    }
    setEditingBudget(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-4">
        <div
          onClick={() => {
            if (activeCampaignId && data.customerId) {
              console.log(
                `https://ads.google.com/aw/overview?customerId=${data.customerId}#~campaign/id=${activeCampaignId}`
              );
              const url = `https://ads.google.com/aw/overview?customerId=${data.customerId}#~campaign/id=${activeCampaignId}`;
              window.open(url, "_blank");
            }
          }}
          className="group cursor-pointer dim hover:brightness-85 flex items-center gap-3"
        >
          <div
            className="rounded-full flex items-center justify-center w-[55px] h-[55px]"
            style={{
              background: currentTheme.background_3,
            }}
          >
            <img
              className="w-[auto] h-[31px]"
              alt=""
              src="https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/google-ads-logo.png"
            />
          </div>
          <div className="group-hover:brightness-85 dim">
            <div
              style={{ color: theme.text_1 }}
              className="font-semibold text-[24px] mt-[-3px]"
            >
              Google Ads
            </div>
            <div
              style={{ color: theme.text_2 }}
              className="text-[13px] mt-[1px]"
            >
              Account{" "}
              {data && data.customerId ? formatPhone(data.customerId) : "..."}
            </div>
          </div>
        </div>
        <div
          className="h-[68px] group cursor-pointer hover:brightness-93 dim flex items-center gap-3 flex-row ml-[2px] pl-[15px] pr-[17px] mt-[2px] rounded-2xl"
          style={{ background: theme.cardBackgroundSolid }}
        >
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[2px]"
            style={{ backgroundColor: currentTheme.background_2 }}
          >
            <ChevronDown
              size={28}
              color={theme.background_4}
              className="opacity-22"
            />
          </div>
          <div className="group-hover:brightness-79 dim mt-[-2px] ml-[1px]">
            <div style={{ color: theme.text_1 }} className="font-semibold">
              {activeCampaign?.name ?? "—"}
            </div>
            <div style={{ color: theme.text_2 }} className="text-xs mt-1">
              Campaign ID: {activeCampaign?.id ?? "—"} •{" "}
              <span
                style={{
                  color:
                    activeCampaign?.status === 3 || activeCampaign?.status === 2
                      ? "#22c55e"
                      : "#94a3b8",
                }}
                className="font-medium"
              >
                {activeCampaign?.status === 3 || activeCampaign?.status === 2
                  ? "Active"
                  : "Paused"}
              </span>
            </div>
          </div>

          {!editingBudget ? (
            <div
              onClick={() => {
                setEditedBudgetValue(String(displayBudget));
                setEditingBudget(true);
              }}
              className="flex items-center gap-[4px] pt-[4px] flex-col"
            >
              <div className="text-xs text-slate-400">Budget</div>
              <div
                className="font-semibold ml-2"
                style={{ color: theme.text_1 }}
              >
                ${Number(displayBudget).toLocaleString()}{" "}
                <span className="text-xs text-slate-400">/ day</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-[6px] flex-col mt-[1px] ml-[5px]">
              <div className="flex flex-row gap-[4px]">
                <button
                  onClick={handleSetBudget}
                  className="cursor-pointer hover:brightness-80 dim px-[17px] h-[23px] rounded-[8px] text-[12px] font-semibold bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingBudget(false)}
                  className="cursor-pointer hover:brightness-95 dim px-2 h-[23px] rounded-md text-sm"
                  style={{
                    background: theme.background_2,
                    color: theme.text_1,
                  }}
                >
                  <X size={15} color={currentTheme.text_1} />
                </button>
              </div>
              <div
                className="font-semibold flex flex-row items-center"
                style={{ color: theme.text_1 }}
              >
                <div
                  className="flex flex-row gap-[3px] px-2 h-[25px] rounded-md w-[60px] text-sm mr-[5px] items-center"
                  style={{
                    background: theme.background_2,
                    color: theme.text_1,
                  }}
                >
                  <p>$</p>
                  <input
                    ref={budgetInputRef}
                    value={editedBudgetValue}
                    onChange={(e) => {
                      let val = e.target.value;

                      // 1. Remove all non-digits
                      val = val.replace(/\D/g, "");

                      // 2. Max length = 2
                      if (val.length > 2) {
                        val = val.slice(0, 2);
                      }

                      // 3. Cannot start with 0 (unless empty)
                      if (val.startsWith("0") && val.length > 1) {
                        val = val.slice(1);
                      }

                      // 4. Allow empty temporarily, but store "" until blur or save
                      setEditedBudgetValue(val);
                    }}
                    onBlur={() => {
                      // Empty → treat as 0
                      if (editedBudgetValue === "") {
                        setEditedBudgetValue("0");
                      }
                    }}
                    className="w-[100%]"
                    style={{
                      outline: "none",
                      border: "none",
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400">/ day</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* <div className="flex items-center gap-3">
        <div
          className="relative rounded-lg"
          style={{ backgroundColor: theme.background_2 }}
        >
          <input
            placeholder="Search operations..."
            className="themed-placeholder px-3 py-2 text-sm w-72 overflow-hidden outline-none border-none"
            style={{ color: theme.text_1 }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80">
            <Search color={theme.text_1} size={14} />
          </div>
        </div>

        <div
          className="group w-[auto] rounded-lg px-[15px]"
          style={{ backgroundColor: theme.background_2 }}
        >
          <select
            // keep hook to parent range state when hooked
            className="group-hover:brightness-75 dim cursor-pointer min-w-[100px] py-2 rounded-lg text-sm border-none outline-none"
            style={{ color: theme.text_1 }}
          >
            <option value="7d">Last 7d</option>
            <option value="30d">Last 30d</option>
            <option value="90d">Last 90d</option>
            <option value="365d">Full</option>
          </select>
        </div>

        <button
          onClick={() => setShowCampaignPicker(!showCampaignPicker)}
          className="px-3 py-2 rounded-lg"
          style={{
            background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Campaigns
        </button>

        {showCampaignPicker && (
          <div
            className="absolute right-6 mt-12 p-3 rounded-2xl shadow-lg w-[380px] z-40"
            style={{ background: theme.background_2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div style={{ color: theme.text_2 }} className="text-sm">
                Choose campaign
              </div>
              <div>
                <button
                  onClick={() => setShowCampaignPicker(false)}
                  className="px-2 py-1 rounded-md text-xs"
                  style={{
                    background: theme.background_2,
                    color: theme.text_1,
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-auto">
              {campaignsList.length === 0 && (
                <div style={{ color: theme.text_2 }} className="text-xs">
                  No campaigns
                </div>
              )}
              {campaignsList
                .sort((a, b) => {
                  const aIs2 = a.status === 2 ? 0 : 1;
                  const bIs2 = b.status === 2 ? 0 : 1;
                  return aIs2 - bIs2;
                })
                .map((c) => {
                  const isActive = c.status === 2;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setActiveCampaignId(c.id);
                        setShowCampaignPicker(false);
                      }}
                      className={`p-2 rounded-md cursor-pointer flex items-center gap-3 ${
                        !isActive ? "brightness-75" : ""
                      }`}
                      style={{
                        background: theme.background_2,
                        border: `1px solid ${theme.text_4}`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: isActive ? "#22c55e" : "#94a3b8",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          style={{ color: theme.text_1 }}
                          className="truncate font-medium"
                        >
                          {c.name}
                        </div>
                        <div
                          style={{ color: theme.text_2 }}
                          className="text-xs truncate"
                        >
                          ID: {c.id} • Budget: {c.budget ?? "—"}
                        </div>
                      </div>
                      <div className="text-xs" style={{ color: theme.text_2 }}>
                        {isActive ? "Active" : "Paused"}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div> */}
    </div>
  );
};

// -------------------- Main parent component ------------------------------
const GoogleAdsDashboard: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject } = useCurrentDataStore();
  const { runModule, projectModules } = useContextQueries();
  const currentTheme = useCurrentTheme();

  // Theme mapping for child components
  const theme = {
    background_1: currentTheme.background_1,
    background_2: currentTheme.background_2,
    background_3: currentTheme.background_3,
    text_1: currentTheme.text_1,
    text_2: currentTheme.text_2,
    text_4: currentTheme.text_4,
    cardBackgroundSolid:
      currentUser && currentUser.theme === "dark"
        ? "rgba(255,255,255,0.03)"
        : "rgba(255,255,255,0.02)",
    cardBackground:
      currentUser && currentUser.theme === "dark"
        ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))"
        : "rgba(255,255,255,0.02)",
  };

  // local state
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "365d">("30d");
  const [activeMetrics, setActiveMetrics] = useState<string[]>([
    "spend",
    "clicks",
  ]);
  const [selectedAdGroupId, setSelectedAdGroupId] = useState<number | null>(
    null
  );
  const [showTableView, setShowTableView] = useState(false);

  // NEW: active campaign + campaign picker + budget edit UI
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [showCampaignPicker, setShowCampaignPicker] = useState(false);
  // const [editingBudget, setEditingBudget] = useState(false);
  // const [editedBudgetValue, setEditedBudgetValue] = useState<string>("");
  // const [savingBudget, setSavingBudget] = useState(false);
  const [budgetSavedToast, setBudgetSavedToast] = useState<string | null>(null);

  // fetch once when module is available
  const fetchGoogleAdsData = async () => {
    if (!projectModules || projectModules.length === 0) return;
    try {
      setIsLoading(true);
      const res = await runModule("google-ads-api-module", {
        action: "getDashboardData",
        params: {},
      });
      console.log(res)

      if (res && res.ok && res.stats) {
        setData(res);
        // setData(savedData);

        const incomingActiveCampaignId =
          res.activeCampaign?.id ?? res.selectedAdGroup?.campaignId ?? null;
        // const incomingActiveCampaignId = savedData.activeCampaign?.id ?? null;
        setActiveCampaignId(incomingActiveCampaignId ?? null);
      } else {
        setData(res);
      }
    } catch (err) {
      console.error("failed to fetch ads dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const main = async () => {
      if (cancelled) return;
      await fetchGoogleAdsData();
    };
    main();
    return () => {
      cancelled = true;
    };
  }, [projectModules]);

  const statsForRange = useMemo(() => {
    if (!data || !data.stats) return [];
    const stats = data.stats as any[];
    let count = 30;
    if (range === "7d") count = 7;
    if (range === "30d") count = 30;
    if (range === "90d") count = 90;
    if (range === "365d") count = stats.length;
    // always take the last `count` entries
    return stats.slice(Math.max(0, stats.length - count));
  }, [data, range]);

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

  // prepare chart data: convert date strings into pretty labels
  const chartData = useMemo(() => {
    return statsForRange.map((r: any) => ({
      date: r.date.slice(5), // "MM-DD" for compact axis
      iso: r.date,
      spend: +(r.spend || 0),
      impressions: +(r.impressions || 0),
      clicks: +(r.clicks || 0),
      conversions: +(r.conversions || 0),
    }));
  }, [statsForRange]);

  const lastDay = chartData[chartData.length - 1];

  // toggle metric in chart
  const handleToggleMetric = (k: string) => {
    setActiveMetrics((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  };

  // list of metric toggles
  const metricOptions = [
    { key: "spend", label: "Spend" },
    { key: "impressions", label: "Impr" },
    { key: "clicks", label: "Clicks" },
    { key: "conversions", label: "Conv" },
  ];

  // ------------------ derived lists from data ----------------------------
  const adGroups = data?.adGroups ?? [];
  useEffect(() => {
    if (!selectedAdGroupId && adGroups && adGroups.length > 0)
      setSelectedAdGroupId(adGroups[0].id);
  }, [adGroups]);

  const headlineRows = data?.keywordData?.terms?.headlines ?? [];
  const descriptionRows = data?.keywordData?.terms?.descriptions ?? [];
  const videoRows = data?.keywordData?.terms?.videos ?? [];
  const imageRows = data?.keywordData?.terms?.images ?? [];

  // sort top items
  const topHeadlines = [...headlineRows].sort(
    (a: any, b: any) => (b.impressions || 0) - (a.impressions || 0)
  );
  const topVideos = [...videoRows].sort(
    (a: any, b: any) => (b.impressions || 0) - (a.impressions || 0)
  );
  const topImages = [...imageRows].sort(
    (a: any, b: any) => (b.impressions || 0) - (a.impressions || 0)
  );

  // ------------------ small UI helpers -----------------------------------
  const handleRangeChange = (r: typeof range) => setRange(r);

  const onSaveBudget = async (campaignId: number | null, newBudget: number) => {
    if (!campaignId) return;
    setIsLoading(true);

    console.log(newBudget)
    runModule("google-ads-api-module", {
      action: "setCampaignBudget",
      params: {
        campaignId,
        amount: newBudget,
      },
    })
      .then(async (res) => {
        // setData(res);
        setBudgetSavedToast("Budget updated!");
        setTimeout(() => setBudgetSavedToast(null), 2000);
        // await fetchGoogleAdsData();
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  };

  // ------------------ Render ---------------------------------------------
  if (!currentUser || !currentProject) return null;

  return (
    <div
      style={{ backgroundColor: currentTheme.background_1 }}
      className="min-h-screen text-slate-100 px-6 pt-[17px] pb-8 font-sans"
    >
      <div className="w-[100%] grid grid-cols-12 gap-6">
        <main className="col-span-12">
          {/* Header */}
          {/* <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h1
                style={{ color: currentTheme.text_1 }}
                className="text-2xl font-bold tracking-tight"
              >
                {currentProject.brand} — Google Ads
              </h1>
              <div
                className="text-xs ml-2 px-2 py-1 rounded-md"
                style={{
                  background: currentTheme.background_2,
                  color: currentTheme.text_2,
                }}
              >
                {data?.campaign?.name ?? "Campaign"}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="relative rounded-lg"
                style={{ backgroundColor: currentTheme.background_2 }}
              >
                <input
                  style={{
                    color: currentTheme.text_1,
                    ["--placeholder-color" as any]: currentTheme.text_1,
                  }}
                  placeholder="Search operations..."
                  className="themed-placeholder px-3 py-2 text-sm w-72 overflow-hidden outline-none border-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80">
                  <Search color={currentTheme.text_1} size={14} />
                </div>
              </div>

              <div
                className="group w-[auto] rounded-lg px-[15px]"
                style={{ backgroundColor: currentTheme.background_2 }}
              >
                <select
                  value={range}
                  onChange={(e) => handleRangeChange(e.target.value as any)}
                  style={{
                    color: currentTheme.text_1,
                  }}
                  className="group-hover:brightness-75 dim cursor-pointer min-w-[100px] py-2 rounded-lg text-sm border-none outline-none"
                >
                  <option value="7d">Last 7d</option>
                  <option value="30d">Last 30d</option>
                  <option value="90d">Last 90d</option>
                  <option value="365d">Full</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setIsLoading(true);
                  // re-fetch
                  runModule("google-ads-api-module", {
                    action: "getDashboardData",
                    params: {},
                  })
                    .then((res) => setData(res))
                    .catch((e) => console.error(e))
                    .finally(() => setIsLoading(false));
                }}
                style={{ backgroundColor: currentTheme.background_2 }}
                className="cursor-pointer hover:brightness-90 dim px-3 py-2 rounded-lg"
              >
                <RefreshCw color={currentTheme.text_1} size={16} />
              </button>

              <button className="cursor-pointer hover:brightness-75 dim px-3 py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white font-semibold">
                Deploy AI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <MetricCard
              title="Spend"
              value={formatCurrency(aggregated.totalSpend || 0)}
              delta={+(Math.random() * 6 - 3).toFixed(1)} // simulated delta
              icon={<DollarSign />}
              loading={isLoading}
              theme={theme}
            />
            <MetricCard
              title="Impressions"
              value={formatInt(aggregated.totalImpressions || 0)}
              delta={+(Math.random() * 6 - 3).toFixed(1)}
              icon={<Activity />}
              loading={isLoading}
              theme={theme}
            />
            <MetricCard
              title="Clicks"
              value={formatInt(aggregated.totalClicks || 0)}
              delta={+(Math.random() * 6 - 3).toFixed(1)}
              icon={<Users />}
              loading={isLoading}
              theme={theme}
            />
            <MetricCard
              title="Conversions"
              value={formatInt(aggregated.totalConversions || 0)}
              delta={+(Math.random() * 6 - 3).toFixed(1)}
              icon={<BarChart2 />}
              loading={isLoading}
              theme={theme}
            />
          </div> */}

          <CampaignTopBar
            data={data}
            currentProject={currentProject}
            theme={theme}
            activeCampaignId={activeCampaignId}
            setActiveCampaignId={setActiveCampaignId}
            showCampaignPicker={showCampaignPicker}
            setShowCampaignPicker={setShowCampaignPicker}
            onSaveBudget={onSaveBudget}
          />
          {budgetSavedToast && (
            <div
              className="fixed right-6 top-28 z-50 px-4 py-2 rounded-md shadow"
              style={{
                background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
                color: "#fff",
              }}
            >
              {budgetSavedToast}
            </div>
          )}

          {/* Main charts + sidebar */}
          <div className="grid grid-cols-12 gap-4">
            <section
              className={"col-span-8 rounded-2xl p-4"}
              style={{ background: theme.cardBackground }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm" style={{ color: theme.text_1 }}>
                    Performance Timeline
                  </div>
                  <div
                    className="text-lg font-semibold"
                    style={{ color: theme.text_1 }}
                  >
                    Spend / Clicks / Impressions over time
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MetricToggle
                    options={metricOptions}
                    active={activeMetrics}
                    onToggle={handleToggleMetric}
                    theme={theme}
                  />
                  <div className="text-xs text-slate-400">
                    Projected CPA: {formatCurrency(aggregated.cpa || 0)}
                  </div>
                </div>
              </div>

              <div style={{ height: 320 }} className="w-full">
                {isLoading ? (
                  <div className="w-full h-full grid place-items-center">
                    <div className="w-[80%]">
                      <SkeletonBox height={220} />
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 24, left: -8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.text_4}
                      />
                      <XAxis dataKey="date" stroke={theme.text_4} />
                      <YAxis stroke={theme.text_4} />
                      <Tooltip content={<AdsTooltip />} />
                      {/* render lines depending on activeMetrics */}
                      {activeMetrics.includes("spend") && (
                        <Line
                          type="monotone"
                          dataKey="spend"
                          name="Spend"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                        />
                      )}
                      {activeMetrics.includes("impressions") && (
                        <Line
                          type="monotone"
                          dataKey="impressions"
                          name="Impressions"
                          stroke="#7c3aed"
                          strokeWidth={2}
                          dot={false}
                          yAxisId={0}
                        />
                      )}
                      {activeMetrics.includes("clicks") && (
                        <Line
                          type="monotone"
                          dataKey="clicks"
                          name="Clicks"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {activeMetrics.includes("conversions") && (
                        <Line
                          type="monotone"
                          dataKey="conversions"
                          name="Conversions"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: theme.background_2 }}
                >
                  <div className="text-xs" style={{ color: theme.text_2 }}>
                    Best Day ({range})
                  </div>
                  <div
                    className="font-semibold text-lg mt-1"
                    style={{ color: theme.text_1 }}
                  >
                    {chartData.length ? (
                      `${
                        chartData.reduce((a, b) => (a.spend > b.spend ? a : b))
                          .iso
                      } • ${formatCurrency(
                        chartData.reduce((a, b) => (a.spend > b.spend ? a : b))
                          .spend
                      )}`
                    ) : (
                      <SkeletonBox height={22} width={160} />
                    )}
                  </div>
                  <div className="mt-2 text-xs" style={{ color: theme.text_2 }}>
                    Clicks:{" "}
                    {
                      chartData.reduce((a, b) => (a.spend > b.spend ? a : b), {
                        clicks: 0,
                        spend: 0,
                      }).clicks
                    }
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl"
                  style={{ background: theme.background_2 }}
                >
                  <div className="text-xs" style={{ color: theme.text_2 }}>
                    Top Creative
                  </div>
                  <div
                    className="font-semibold text-lg mt-1"
                    style={{ color: theme.text_1 }}
                  >
                    {topVideos?.[0]?.youtubeVideoId
                      ? `Video • ${topVideos[0].youtubeVideoId}`
                      : topImages?.[0]?.resourceName ?? "—"}
                  </div>
                  <div className="mt-2 text-xs" style={{ color: theme.text_2 }}>
                    Impr:{" "}
                    {topVideos?.[0]?.impressions ??
                      topImages?.[0]?.impressions ??
                      0}
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl"
                  style={{ background: theme.background_2 }}
                >
                  <div className="text-xs" style={{ color: theme.text_2 }}>
                    Latency
                  </div>
                  <div
                    className="font-semibold text-lg mt-1"
                    style={{ color: theme.text_1 }}
                  >
                    45 ms
                  </div>
                  <div className="mt-2 text-xs" style={{ color: theme.text_2 }}>
                    Server load nominal
                  </div>
                </div>
              </div>
            </section>

            <aside className="col-span-4 flex flex-col gap-4 rounded-2xl">
              <div
                className="rounded-2xl p-4"
                style={{ background: theme.cardBackground }}
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
                            value: Math.max(
                              1,
                              aggregated.totalImpressions || 0
                            ),
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
                    <div style={{ color: theme.text_2 }}>Spend</div>
                    <div
                      style={{ color: theme.text_2 }}
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
                    <div style={{ color: theme.text_2 }}>Impr</div>
                    <div
                      style={{ color: theme.text_2 }}
                      className="ml-auto font-semibold"
                    >
                      {formatInt(aggregated.totalImpressions || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: theme.cardBackground }}
              >
                <div className="p-2 rounded-lg bg-white/5">
                  <Zap color={theme.text_2} />
                </div>
                <div>
                  <div style={{ color: theme.text_2 }} className="text-xs">
                    AI Suggestion
                  </div>
                  <div
                    style={{ color: theme.text_2 }}
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
                style={{ background: theme.cardBackground }}
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
                          selectedAdGroupId === g.id
                            ? "#fff"
                            : currentTheme.text_1,
                      }}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* Bottom section: top creatives + keywords + products */}
          <div className="grid grid-cols-12 gap-4 mt-4">
            <section
              className="col-span-8 rounded-2xl p-4"
              style={{ background: theme.cardBackground }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm" style={{ color: theme.text_2 }}>
                    Top Creatives
                  </div>
                  <div
                    className="text-lg font-semibold"
                    style={{ color: theme.text_1 }}
                  >
                    Videos & Images performance
                  </div>
                </div>

                <div className="text-xs text-slate-400">Updated recently</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Videos */}
                <TopAssetsTable
                  title="Top Videos"
                  rows={topVideos.map((v: any) => ({
                    "Video ID": v.youtubeVideoId,
                    Impr: v.impressions,
                    Clicks: v.clicks,
                    Cost: formatCurrency(v.cost || 0),
                    Conv: v.conversions,
                  }))}
                  columns={["Video ID", "Impr", "Clicks", "Cost", "Conv"]}
                  theme={theme}
                />
                {/* Images */}
                <TopAssetsTable
                  title="Top Images"
                  rows={topImages.map((i: any) => ({
                    Resource: i.resourceName,
                    Impr: i.impressions,
                    Clicks: i.clicks,
                    Cost: formatCurrency(i.cost || 0),
                    Conv: i.conversions,
                  }))}
                  columns={["Resource", "Impr", "Clicks", "Cost", "Conv"]}
                  theme={theme}
                />
                {/* Headlines */}
                <TopAssetsTable
                  title="Top Headlines"
                  rows={topHeadlines.map((h: any) => ({
                    Headline: h.text,
                    Impr: h.impressions,
                    Clicks: h.clicks,
                    Cost: formatCurrency(h.cost || 0),
                    Conv: h.conversions,
                  }))}
                  columns={["Headline", "Impr", "Clicks", "Cost", "Conv"]}
                  theme={theme}
                />
              </div>
            </section>

            <aside
              className="col-span-4 rounded-2xl p-4"
              style={{ background: theme.cardBackground }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-slate-400">Locations</div>
                  <div
                    className="text-lg font-semibold"
                    style={{ color: theme.text_1 }}
                  >
                    Targeted geos
                  </div>
                </div>
                <div className="text-xs text-slate-400">Active</div>
              </div>

              <div className="space-y-2">
                {(data?.locations ?? []).map((loc: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-md"
                    style={{ background: currentTheme.background_2 }}
                  >
                    <MapPin />
                    <div style={{ color: theme.text_2 }}>{loc.name}</div>
                    <div className="ml-auto text-xs text-slate-400">
                      {loc.type}
                    </div>
                  </div>
                ))}
                {(data?.locations ?? []).length === 0 && (
                  <div className="text-xs text-slate-400">
                    No locations targeted
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">Controls</div>
                  <div className="text-xs text-slate-400">View</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTableView(false)}
                    className="px-3 py-2 rounded-md"
                    style={{
                      background: currentTheme.background_2,
                      color: currentTheme.text_1,
                    }}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setShowTableView(true)}
                    className="px-3 py-2 rounded-md"
                    style={{
                      background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
                      color: "#fff",
                    }}
                  >
                    Table
                  </button>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-400">
                Ad Group: {data?.selectedAdGroup?.name ?? "—"}
              </div>
            </aside>
          </div>

          {/* Keyword & details rows */}
          <div className="grid grid-cols-12 gap-4 mt-4">
            <section
              className="col-span-8 rounded-2xl p-4"
              style={{ background: theme.cardBackground }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-slate-400">
                    Keyword & Copy Performance
                  </div>
                  <div
                    className="text-lg font-semibold"
                    style={{ color: theme.text_1 }}
                  >
                    Headlines & Descriptions
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Sort by impressions
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TopAssetsTable
                  title="Headlines"
                  rows={topHeadlines.map((h: any) => ({
                    Headline: h.text,
                    Impr: h.impressions,
                    Clicks: h.clicks,
                    Cost: formatCurrency(h.cost || 0),
                    Conv: h.conversions,
                  }))}
                  columns={["Headline", "Impr", "Clicks", "Cost", "Conv"]}
                  theme={theme}
                />
                <TopAssetsTable
                  title="Descriptions"
                  rows={descriptionRows.map((d: any) => ({
                    Description: d.text,
                    Impr: d.impressions,
                    Clicks: d.clicks,
                    Cost: formatCurrency(d.cost || 0),
                    Conv: d.conversions,
                  }))}
                  columns={["Description", "Impr", "Clicks", "Cost", "Conv"]}
                  theme={theme}
                />
              </div>
            </section>

            <aside
              className="col-span-4 rounded-2xl p-4"
              style={{ background: theme.cardBackground }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-slate-400">Performance KPIs</div>
                  <div
                    className="text-lg font-semibold"
                    style={{ color: theme.text_1 }}
                  >
                    Key metrics
                  </div>
                </div>
                <div className="text-xs text-slate-400">Range: {range}</div>
              </div>

              <div className="space-y-3">
                <div
                  className="p-3 rounded-md"
                  style={{ background: currentTheme.background_2 }}
                >
                  <div className="text-xs" style={{ color: theme.text_2 }}>
                    CTR
                  </div>
                  <div
                    className="font-semibold text-lg"
                    style={{ color: theme.text_1 }}
                  >
                    {(aggregated.ctr * 100).toFixed(2)}%
                  </div>
                </div>

                <div
                  className="p-3 rounded-md"
                  style={{ background: currentTheme.background_2 }}
                >
                  <div className="text-xs" style={{ color: theme.text_2 }}>
                    Avg CPC
                  </div>
                  <div
                    className="font-semibold text-lg"
                    style={{ color: theme.text_1 }}
                  >
                    {formatCurrency(aggregated.cpc)}
                  </div>
                </div>

                <div
                  className="p-3 rounded-md"
                  style={{ background: currentTheme.background_2 }}
                >
                  <div className="text-xs" style={{ color: theme.text_2 }}>
                    CPA
                  </div>
                  <div
                    className="font-semibold text-lg"
                    style={{ color: theme.text_1 }}
                  >
                    {formatCurrency(aggregated.cpa)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button className="w-full py-2 rounded-md bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white">
                  Export CSV
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GoogleAdsDashboard;
