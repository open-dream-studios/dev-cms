// project/src/modules/DashboardModule/GoogleAdsDashboard.tsx
import { useCallback, useEffect, useRef } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import DashboardSkeleton, { EmptyComponent } from "./DashboardSkeleton";
import GoogleAdsTopBar from "./components/GoogleAdsTopBar";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import savedData from "./data.json";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import GoogleAdsPerformanceGraph from "./components/GoogleAdsPerformanceGraph";
import GoogleAdsMap from "./GoogleAdsMap";
import GoogleAdsMetrics from "./components/GoogleAdsMetrics";

export default function GoogleAdsDashboard() {
  const { clearModules, addModule, updateModule } = useLayoutStore();

  const { projectModules, runModule } = useContextQueries();
  const { setGoogleAdsData, selectedCampaignId, setSelectedCampaignId } =
    useCurrentDataStore();
  const { setIsLoadingGoogleAdsData } = useUiStore();

  useEffect(() => {
    clearModules();
    addModule({
      id: "topBar",
      component: GoogleAdsTopBar,
      colSpan: 8,
      rowSpan: 4,
      bg: false,
      loading: false,
      overflowHidden: false,
    });

    addModule({
      id: "mainGraph",
      component: GoogleAdsPerformanceGraph,
      colSpan: 5,
      rowSpan: 24,
    });

    addModule({
      id: "rightTop",
      component: GoogleAdsMap,
      props: { type: "summary" },
      colSpan: 3,
      rowSpan: 12,
    });

    addModule({
      id: "rightBottom",
      component: GoogleAdsMetrics,
      props: { type: "secondary" },
      colSpan: 3,
      rowSpan: 12,
    });

    addModule({
      id: "bottomFull",
      component: EmptyComponent,
      colSpan: 8,
      rowSpan: 11,
    });
  }, []);

  const showLoadingSkeletons = () => {
    updateModule("mainGraph", { loading: true });
    updateModule("rightTop", { loading: true });
    updateModule("rightBottom", { loading: true });
    updateModule("bottomFull", { loading: true });
  };

  const hideLoadingSkeletons = () => {
    updateModule("mainGraph", { loading: false });
    updateModule("rightTop", { loading: false });
    updateModule("rightBottom", { loading: false });
    updateModule("bottomFull", { loading: false });
  };

  const fetchGoogleAdsData = useCallback(
    async (
      campaignId: number | null = null,
      cancelToken = { cancelled: false }
    ) => {
      if (!projectModules || projectModules.length === 0) return;
      try {
        showLoadingSkeletons();
        setIsLoadingGoogleAdsData(true);

        // const response = await runModule("google-ads-api-module", {
        //   action: "getDashboardData",
        //   params: campaignId ? { campaignId } : {},
        // });
        const res = savedData;

        if (cancelToken.cancelled) return;
        // const res = response.data
        setGoogleAdsData(res);
        console.log(res);

        // if (!campaignId) {
        // const incomingActiveCampaignId =
        //   res.activeCampaign?.id ?? res.selectedAdGroup?.campaignId ?? null;
        const incomingActiveCampaignId = savedData.activeCampaign.id;

        setSelectedCampaignId(incomingActiveCampaignId);
        // }
      } catch (err) {
        if (!cancelToken.cancelled) {
          console.error("Failed to fetch Google Ads data:", err);
          setGoogleAdsData({ ok: false, error: String(err) });
        }
      } finally {
        if (!cancelToken.cancelled) {
          setIsLoadingGoogleAdsData(false);
        }
        hideLoadingSkeletons();
      }
    },
    [projectModules, runModule]
  );

  useEffect(() => {
    const cancelToken = { cancelled: false };
    fetchGoogleAdsData(null, cancelToken);
    return () => {
      cancelToken.cancelled = true;
    };
  }, [projectModules]);

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
  }, [selectedCampaignId]);

  return <DashboardSkeleton />;
}
