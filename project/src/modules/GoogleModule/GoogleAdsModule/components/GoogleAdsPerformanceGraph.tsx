// project/src/modules/DashboardModule/components/GoogleAdsPerformanceGraph.tsx
import { useCurrentTheme } from "@/hooks/useTheme";
import React, { useContext, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AdsTooltip, MetricToggle } from "./components";
import { formatCurrency, metricOptions } from "./data";
import { AuthContext } from "@/contexts/authContext";
import { useGoogleCurrentDataStore } from "../../_store/useGoogleCurrentDataStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useGoogleUIStore } from "../../_store/useGoogleUIStore";
import SmoothSkeleton from "@/lib/skeletons/SmoothSkeleton";

const GoogleAdsPerformanceGraph = () => {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const { currentProject } = useCurrentDataStore();
  const {
    googleAdsData,
    currentGoogleAdsRange,
    selectedAdGroupId,
    setSelectedAdGroupId,
    selectedGoogleAdsMetrics,
    setSelectedGoogleAdsMetrics,
  } = useGoogleCurrentDataStore();
  const { isLoadingGoogleAdsData } = useGoogleUIStore();

  const statsForRange = useMemo(() => {
    if (!googleAdsData || !googleAdsData.stats) return [];
    const stats = googleAdsData.stats as any[];
    let count = 30;
    if (currentGoogleAdsRange === "7d") count = 7;
    if (currentGoogleAdsRange === "30d") count = 30;
    if (currentGoogleAdsRange === "90d") count = 90;
    // if (range === "365d") count = stats.length;
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

  const chartData = useMemo(() => {
    if (!statsForRange || !statsForRange.length) return [];

    // generate a stable string key to detect real changes
    const key = statsForRange
      .map(
        (r) =>
          `${r.date}-${r.spend}-${r.impressions}-${r.clicks}-${r.conversions}`
      )
      .join("|");

    return statsForRange.map((r) => ({
      date: r.date.slice(5),
      iso: r.date,
      spend: +(r.spend || 0),
      impressions: +(r.impressions || 0),
      clicks: +(r.clicks || 0),
      conversions: +(r.conversions || 0),
    }));
  }, [
    statsForRange
      .map(
        (r) =>
          `${r.date}-${r.spend}-${r.impressions}-${r.clicks}-${r.conversions}`
      )
      .join("|"),
  ]);

  const handleToggleMetric = (k: string) => {
    const result = selectedGoogleAdsMetrics.includes(k)
      ? selectedGoogleAdsMetrics.filter((x: any) => x !== k)
      : [...selectedGoogleAdsMetrics, k];
    setSelectedGoogleAdsMetrics(result);
  };

  useEffect(() => {
    const adGroups = googleAdsData?.adGroups ?? [];
    if (!selectedAdGroupId && adGroups && adGroups.length > 0)
      setSelectedAdGroupId(adGroups[0].id);
  }, [selectedAdGroupId, setSelectedAdGroupId, googleAdsData]);

  const videoRows = googleAdsData?.keywordData?.terms?.videos ?? [];
  const imageRows = googleAdsData?.keywordData?.terms?.images ?? [];

  const topVideos = [...videoRows].sort(
    (a: any, b: any) => (b.impressions || 0) - (a.impressions || 0)
  );
  const topImages = [...imageRows].sort(
    (a: any, b: any) => (b.impressions || 0) - (a.impressions || 0)
  );

  if (!currentUser || !currentProject) return null;

  if (isLoadingGoogleAdsData) {
    return <SmoothSkeleton />;
  }

  return (
    <div
      className={"w-[100%] p-[20px]"}
      style={{ background: currentTheme.cardBackground }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm" style={{ color: currentTheme.text_1 }}>
            Performance Timeline
          </div>
          <div
            className="text-lg font-semibold"
            style={{ color: currentTheme.text_1 }}
          >
            Spend / Clicks / Impressions
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MetricToggle
            options={metricOptions}
            active={selectedGoogleAdsMetrics}
            onToggle={handleToggleMetric}
            theme={currentTheme}
          />
          <div className="text-xs text-slate-400">
            Projected CPA: {formatCurrency(aggregated.cpa || 0)}
          </div>
        </div>
      </div>

      <div style={{ height: 295 }} className="w-full">
        {isLoadingGoogleAdsData ? (
          <div className="w-full h-full grid place-items-center">
            <div className="w-[80%]">{/* <SkeletonBox height={220} /> */}</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 24, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={currentTheme.text_4}
              />
              <XAxis dataKey="date" stroke={currentTheme.text_4} />
              <YAxis stroke={currentTheme.text_4} />
              <Tooltip content={<AdsTooltip />} />
              {/* render lines depending on activeMetrics */}
              {selectedGoogleAdsMetrics.includes("spend") && (
                <Line
                  type="monotone"
                  dataKey="spend"
                  name="Spend"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              )}
              {selectedGoogleAdsMetrics.includes("impressions") && (
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
              {selectedGoogleAdsMetrics.includes("clicks") && (
                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="Clicks"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {selectedGoogleAdsMetrics.includes("conversions") && (
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
          style={{ background: currentTheme.background_2 }}
        >
          <div className="text-xs" style={{ color: currentTheme.text_2 }}>
            Best Day ({currentGoogleAdsRange})
          </div>
          <div
            className="font-semibold text-lg mt-1"
            style={{ color: currentTheme.text_1 }}
          >
            {chartData.length ? (
              `${
                chartData.reduce((a, b) => (a.spend > b.spend ? a : b)).iso
              } • ${formatCurrency(
                chartData.reduce((a, b) => (a.spend > b.spend ? a : b)).spend
              )}`
            ) : (
              // <SkeletonBox height={22} width={160} />
              <></>
            )}
          </div>
          {/* <div className="mt-2 text-xs" style={{ color: currentTheme.text_2 }}>
            Clicks:{" "}
            {
              chartData.reduce((a, b) => (a.spend > b.spend ? a : b), {
                clicks: 0,
                spend: 0,
              }).clicks
            }
          </div> */}
        </div>

        <div
          className="p-3 rounded-xl"
          style={{ background: currentTheme.background_2 }}
        >
          <div className="text-xs" style={{ color: currentTheme.text_2 }}>
            Top Creative
          </div>
          <div
            className="font-semibold text-lg mt-1"
            style={{ color: currentTheme.text_1 }}
          >
            {topVideos?.[0]?.youtubeVideoId
              ? `Video • ${topVideos[0].youtubeVideoId}`
              : topImages?.[0]?.resourceName ?? "—"}
          </div>
          {/* <div className="mt-2 text-xs" style={{ color: currentTheme.text_2 }}>
            Impr:{" "}
            {topVideos?.[0]?.impressions ?? topImages?.[0]?.impressions ?? 0}
          </div> */}
        </div>

        <div
          className="p-3 rounded-xl"
          style={{ background: currentTheme.background_2 }}
        >
          <div className="text-xs" style={{ color: currentTheme.text_2 }}>
            Latency
          </div>
          <div
            className="font-semibold text-lg mt-1"
            style={{ color: currentTheme.text_1 }}
          >
            45 ms
          </div>
          {/* <div className="mt-2 text-xs" style={{ color: currentTheme.text_2 }}>
            Server load nominal
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsPerformanceGraph;
