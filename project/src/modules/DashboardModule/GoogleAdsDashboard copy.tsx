// project/src/modules/GoogleAdsModule/GoogleAdsDashboard.tsx
import React, { useContext, useEffect, useMemo, useState } from "react";
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
import {
  Search,
  Activity,
  DollarSign,
  Users,
  BarChart2,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { MetricCard, TopAssetsTable } from "./components/components";
import { formatCurrency, formatInt } from "./components/data";
import { useUiStore } from "@/store/useUIStore";

const GoogleAdsDashboard: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentProject,
    googleAdsData,
    currentGoogleAdsRange,
    setCurrentGoogleAdsRange,
  } = useCurrentDataStore();
  const { isLoadingGoogleAdsData } = useUiStore();
  const currentTheme = useCurrentTheme();

  const theme = {
    background_1: currentTheme.background_1,
    background_2: currentTheme.background_2,
    background_3: currentTheme.background_3,
    text_1: currentTheme.text_1,
    text_2: currentTheme.text_2,
    text_4: currentTheme.text_4,
    cardBackgroundSolid:
      currentUser && currentUser.theme === "dark"
        ? "#1D1D1D"
        : "rgba(255,255,255,0.02)",
    cardBackground:
      currentUser && currentUser.theme === "dark"
        ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))"
        : "rgba(255,255,255,0.02)",
  };

  const [showTableView, setShowTableView] = useState(false);
  const [budgetSavedToast, setBudgetSavedToast] = useState<string | null>(null);

  const statsForRange = useMemo(() => {
    if (!googleAdsData || !googleAdsData.stats) return [];
    const stats = googleAdsData.stats as any[];
    let count = 30;
    if (currentGoogleAdsRange === "7d") count = 7;
    if (currentGoogleAdsRange === "30d") count = 30;
    if (currentGoogleAdsRange === "90d") count = 90;
    // if (currentGoogleAdsRange === "365d") count = stats.length;
    // always take the last `count` entries
    return stats.slice(Math.max(0, stats.length - count));
  }, [googleAdsData, currentGoogleAdsRange]);

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

  const headlineRows = googleAdsData?.keywordData?.terms?.headlines ?? [];
  const descriptionRows = googleAdsData?.keywordData?.terms?.descriptions ?? [];
  const videoRows = googleAdsData?.keywordData?.terms?.videos ?? [];
  const imageRows = googleAdsData?.keywordData?.terms?.images ?? [];

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
  const handleRangeChange = (r: typeof currentGoogleAdsRange) =>
    setCurrentGoogleAdsRange(r);

  // ------------------ Render ---------------------------------------------
  if (!currentUser || !currentProject) return null;

  return (
    <div
      style={{ backgroundColor: currentTheme.background_1 }}
      className="min-h-screen text-slate-100 px-6 pt-[17px] pb-8 font-sans"
    >
      <div className="w-[100%] grid grid-cols-12 gap-6">
        <main className="col-span-12">
          {/* <CampaignTopBar /> */}
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
                {(googleAdsData?.locations ?? []).map((loc: any, i: number) => (
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
                {(googleAdsData?.locations ?? []).length === 0 && (
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
                Ad Group: {googleAdsData?.selectedAdGroup?.name ?? "—"}
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
                <div className="text-xs text-slate-400">Range: {currentGoogleAdsRange}</div>
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

          <div className="flex items-center justify-between gap-4 mb-4">
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
                {googleAdsData?.campaign?.name ?? "Campaign"}
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
                  value={currentGoogleAdsRange}
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
                  // setIsLoadingGoogleAdsData(true);
                  // // re-fetch
                  // runModule("google-ads-api-module", {
                  //   action: "getDashboardData",
                  //   params: {},
                  // })
                  //   .then((res) => setData(res))
                  //   .catch((e) => console.error(e))
                  //   .finally(() => setIsLoading(false));
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
              loading={isLoadingGoogleAdsData}
              theme={theme}
            />
            <MetricCard
              title="Impressions"
              value={formatInt(aggregated.totalImpressions || 0)}
              delta={+(Math.random() * 6 - 3).toFixed(1)}
              icon={<Activity />}
              loading={isLoadingGoogleAdsData}
              theme={theme}
            />
            <MetricCard
              title="Clicks"
              value={formatInt(aggregated.totalClicks || 0)}
              delta={+(Math.random() * 6 - 3).toFixed(1)}
              icon={<Users />}
              loading={isLoadingGoogleAdsData}
              theme={theme}
            />
            <MetricCard
              title="Conversions"
              value={formatInt(aggregated.totalConversions || 0)}
              delta={+(Math.random() * 6 - 3).toFixed(1)}
              icon={<BarChart2 />}
              loading={isLoadingGoogleAdsData}
              theme={theme}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default GoogleAdsDashboard;
