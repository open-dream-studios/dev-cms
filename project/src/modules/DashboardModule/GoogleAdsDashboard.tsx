import { useCallback, useEffect, useRef } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import DashboardSkeleton, { EmptyComponent } from "./DashboardSkeleton";
import GoogleAdsTopBar from "./components/GoogleAdsTopBar";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import savedData from "./data.json";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import GoogleAdsPerformanceGraph from "./components/GoogleAdsPerformanceGraph";

const TopBar2 = () => {
  return <div className="w-[100%] h-[100%]"></div>;
};

export default function GoogleAdsDashboard() {
  const clearModules = useLayoutStore((s) => s.clearModules);
  const addModule = useLayoutStore((s) => s.addModule);
  const updateModule = useLayoutStore((s) => s.updateModule);

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
      rowSpan: 1,
      bg: false,
      loading: false,
      overflowHidden: false,
    });

    addModule({
      id: "mainGraph",
      component: GoogleAdsPerformanceGraph,
      colSpan: 5,
      rowSpan: 6,
      bg: true,
    });

    addModule({
      id: "rightTop",
      component: EmptyComponent,
      props: { type: "summary" },
      colSpan: 3,
      rowSpan: 3,
    });

    addModule({
      id: "rightBottom",
      component: EmptyComponent,
      props: { type: "secondary" },
      colSpan: 3,
      rowSpan: 3,
    });

    addModule({
      id: "bottomFull",
      component: EmptyComponent,
      colSpan: 8,
      rowSpan: 3,
    });
  }, []);

  const fetchGoogleAdsData = useCallback(
    async (
      campaignId: number | null = null,
      cancelToken = { cancelled: false }
    ) => {
      if (!projectModules || projectModules.length === 0) return;
      try {
        setIsLoadingGoogleAdsData(true);

        // const res = await runModule("google-ads-api-module", {
        //   action: "getDashboardData",
        //   params: campaignId ? { campaignId } : {},
        // });
        const res = savedData;

        if (cancelToken.cancelled) return;

        setGoogleAdsData(res);
        console.log(res);

        // if (!campaignId) {
        //   const incomingActiveCampaignId =
        //     res.activeCampaign?.id ?? res.selectedAdGroup?.campaignId ?? null;
        const incomingActiveCampaignId = savedData.activeCampaign.id;

        setSelectedCampaignId(incomingActiveCampaignId);

        updateModule("mainGraph", {
          loading: false,
        });
        // }
      } catch (err) {
        if (!cancelToken.cancelled) {
          console.error("Failed to fetch Google Ads data:", err);
          setGoogleAdsData({ ok: false, error: String(err) });
        }
      } finally {
        if (!cancelToken.cancelled) setIsLoadingGoogleAdsData(false);
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
