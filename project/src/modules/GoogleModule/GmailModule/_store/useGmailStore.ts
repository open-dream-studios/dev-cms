// src/modules/GoogleModule/GmailModule/_store/useGmailStore.ts
import { create } from "zustand";
import { MessageDetail } from "@open-dream/shared";

export const gmailInitialState = {
  selectedId: null as string | null,
  detail: null as MessageDetail | null,
  search: "",
  showHeaders: false,
  photoError: false,
  isComposing: false,
  isReplying: false,
};

type GmailState = typeof gmailInitialState;

type GmailStore = GmailState & {
  reset: () => void;
} & {
  [K in keyof GmailState as `set${Capitalize<string & K>}`]: (
    value: GmailState[K]
  ) => void;
};

export const useGmailStore = create<GmailStore>((set) => {
  const setters = Object.fromEntries(
    Object.keys(gmailInitialState).map((key) => {
      const fnName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      return [fnName, (value: any) => set({ [key]: value })];
    })
  );

  return {
    ...gmailInitialState,
    reset: () => set(gmailInitialState),
    ...setters,
  } as GmailStore;
});
