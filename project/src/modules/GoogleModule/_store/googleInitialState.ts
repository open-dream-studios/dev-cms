// src/modules/GoogleModule/_store/googleInitialState.ts
import { GoogleAdsData, GoogleAdsRange } from "@open-dream/shared";

export const googleUIInitialState = {
  isLoadingGoogleAdsData: true,
  showCampaignPicker: false,
};

export const googleDataInitialState = {
  selectedGoogleAdsMetrics: ["spend", "clicks"] as string[],
  currentGoogleAdsRange: "7d" as GoogleAdsRange,
  selectedAdGroupId: null as number | null,
  selectedCampaignId: null as number | null,
  googleAdsData: null as GoogleAdsData | null,
};
