// project/src/modules/DashboardModule/GoogleAdsDashboard.tsx
import { useCallback, useEffect, useRef } from "react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import savedData from "./data.json";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import GoogleAdsTopBar from "./components/GoogleAdsTopBar";
import GoogleAdsPerformanceGraph from "./components/GoogleAdsPerformanceGraph";
import GoogleAdsMap from "./GoogleAdsMap";
import GoogleAdsMetrics from "./components/GoogleAdsMetrics";
import { useDashboardStore } from "../../../store/useDashboardStore";
import { Dashboard } from "@/components/Dashboard/Dashboard";
import { DashboardLayout1 } from "@/components/Dashboard/DashboardPresets";

export default function GoogleAdsDashboard() {
  const { projectModules } = useContextQueries();
  const { setGoogleAdsData, selectedCampaignId, setSelectedCampaignId } =
    useCurrentDataStore();
  const { setIsLoadingGoogleAdsData } = useUiStore();
  const { setLayout, registerModules } = useDashboardStore();

  useEffect(() => {
    registerModules({
      layout1_topbar: GoogleAdsTopBar,
      layout1_graph: GoogleAdsPerformanceGraph,
      layout1_map: GoogleAdsMap,
      layout1_metrics: GoogleAdsMetrics,
      // layout1_bottom: BottomModule,
    });

    setLayout(DashboardLayout1);
  }, [registerModules, setLayout]);

  // const changeLayout = () => {
  //   setLayout({
  //     ...DashboardLayout1,
  //     sections: DashboardLayout1.sections.map((s) =>
  //       s.id === "middle" ? { ...s, heightRatio: 0.55 } : s
  //     ),
  //   });
  // };

  const fetchGoogleAdsData = useCallback(
    async (
      campaignId: number | null = null,
      cancelToken = { cancelled: false }
    ) => {
      if (!projectModules || projectModules.length === 0) return;

      try {
        // showLoading();
        setIsLoadingGoogleAdsData(true);

        const res = savedData;
        if (cancelToken.cancelled) return;

        setGoogleAdsData(res);

        const incomingActiveCampaignId = savedData.activeCampaign.id;

        setSelectedCampaignId(incomingActiveCampaignId);
      } catch (err) {
        if (!cancelToken.cancelled) {
          console.error("Failed to fetch Google Ads data:", err);
          setGoogleAdsData({ ok: false, error: String(err) });
        }
      } finally {
        if (!cancelToken.cancelled) {
          setIsLoadingGoogleAdsData(false);
        }
        // hideLoading();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      projectModules,
      setGoogleAdsData,
      setIsLoadingGoogleAdsData,
      setSelectedCampaignId,
    ]
  );

  useEffect(() => {
    const cancelToken = { cancelled: false };
    fetchGoogleAdsData(null, cancelToken);
    return () => {
      cancelToken.cancelled = true;
    };
  }, [fetchGoogleAdsData, projectModules]);

  const hasSelectedCampaign = useRef(false);

  useEffect(() => {
    if (selectedCampaignId === null) return;
    if (!hasSelectedCampaign.current) {
      hasSelectedCampaign.current = true;
      return;
    }
    const cancelToken = { cancelled: false };
    fetchGoogleAdsData(selectedCampaignId, cancelToken);
    return () => {
      cancelToken.cancelled = true;
    };
  }, [fetchGoogleAdsData, selectedCampaignId]);

  return <Dashboard minHeight={800} maxHeight={900} gap={10} />;
}
