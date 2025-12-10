// project/src/modules/DashboardModule/GoogleAdsDashboard.tsx
import { useCallback, useEffect, useRef } from "react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import savedData from "./data.json";
import GoogleAdsTopBar from "./components/GoogleAdsTopBar";
import GoogleAdsPerformanceGraph from "./components/GoogleAdsPerformanceGraph";
import GoogleAdsMap from "./components/GoogleAdsMap";
import GoogleAdsMetrics from "./components/GoogleAdsMetrics";
import { useDashboardStore } from "../../../store/useDashboardStore";
import { Dashboard } from "@/components/Dashboard/Dashboard";
import { DashboardLayout2 } from "@/components/Dashboard/presets/DashboardPreset2";
import { useGoogleCurrentDataStore } from "../_store/useGoogleCurrentDataStore";
import { useGoogleUIStore } from "../_store/useGoogleUIStore";

export default function GoogleAdsDashboard() {
  const { projectModules } = useContextQueries();
  const { setGoogleAdsData, selectedCampaignId, setSelectedCampaignId } =
    useGoogleCurrentDataStore();
  const { setIsLoadingGoogleAdsData } = useGoogleUIStore();
  const { setLayout, registerModules } = useDashboardStore();

  useEffect(() => {
    registerModules({
      layout2_t: GoogleAdsTopBar,
      layout2_m1: GoogleAdsPerformanceGraph,
      layout2_m2: GoogleAdsMap,
      layout2_m3: GoogleAdsMetrics,
      layout2_b: null,
    });

    setLayout(DashboardLayout2);
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
        const res = savedData;
        if (cancelToken.cancelled) return;
        setIsLoadingGoogleAdsData(true);
        console.log(res);
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
      }
    },
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
