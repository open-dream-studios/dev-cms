// project/src/modules/GoogleModule/_googleStore.ts
import { createStore } from "@/store/createStore";
import { GoogleAdsData, GoogleAdsRange } from "@open-dream/shared";

export const useGoogleUIStore = createStore({
  isLoadingGoogleAdsData: true,
  showCampaignPicker: false,
});

export const useGoogleDataStore = createStore({
  selectedGoogleAdsMetrics: ["spend", "clicks"] as string[],
  currentGoogleAdsRange: "7d" as GoogleAdsRange,
  selectedAdGroupId: null as number | null,
  selectedCampaignId: null as number | null,
  googleAdsData: null as GoogleAdsData | null,
});