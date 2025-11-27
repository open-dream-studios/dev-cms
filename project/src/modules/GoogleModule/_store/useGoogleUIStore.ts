// src/modules/GoogleModule/_store/useGoogleUIStore.ts
import { create } from "zustand";
import { googleUIInitialState } from "./googleInitialState";

type GoogleUIState = typeof googleUIInitialState & {
  resetGoogleUIStore: () => void;
  setIsLoadingGoogleAdsData: (val: boolean) => void;
  setShowCampaignPicker: (val: boolean) => void;
};

export const useGoogleUIStore = create<GoogleUIState>((set) => ({
  ...googleUIInitialState,

  resetGoogleUIStore: () => set(googleUIInitialState),

  setIsLoadingGoogleAdsData: (val) =>
    set({ isLoadingGoogleAdsData: val }),

  setShowCampaignPicker: (val) =>
    set({ showCampaignPicker: val }),
}));