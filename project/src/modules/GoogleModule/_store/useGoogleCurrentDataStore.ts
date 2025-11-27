// src/modules/GoogleModule/_store/useGoogleCurrentDataStore.ts
import { create } from "zustand";
import { googleDataInitialState } from "./googleInitialState";
import { GoogleAdsRange } from "@open-dream/shared";

type GoogleDataState = typeof googleDataInitialState & {
  resetGoogleDataStore: () => void;
  setSelectedGoogleAdsMetrics: (metrics: string[]) => void;
  setCurrentGoogleAdsRange: (range: GoogleAdsRange) => void;
  setSelectedAdGroupId: (id: number | null) => void;
  setSelectedCampaignId: (id: number | null) => void;
  setGoogleAdsData: (data: any) => void;
};

export const useGoogleCurrentDataStore = create<GoogleDataState>((set) => ({
  ...googleDataInitialState,

  resetGoogleDataStore: () => set(googleDataInitialState),

  setSelectedGoogleAdsMetrics: (metrics) =>
    set({ selectedGoogleAdsMetrics: metrics }),

  setCurrentGoogleAdsRange: (range) => set({ currentGoogleAdsRange: range }),

  setSelectedAdGroupId: (id) => set({ selectedAdGroupId: id }),

  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),

  setGoogleAdsData: (data) => set({ googleAdsData: data }),
}));
