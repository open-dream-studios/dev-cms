import { create } from "zustand";
import { GmailRequestType } from "@open-dream/shared";

interface GmailStoreState {
  label: GmailRequestType | null;

  messages: any[];
  hasNextPage: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;

  // Actions mapped from the hook
  fetchNextPage: () => void;
  refresh: () => void;

  // Internal setter for the hook to update the store
  _setFromQuery: (data: Partial<GmailStoreState>) => void;
}

export const useGmailDataStore = create<GmailStoreState>((set) => ({
  label: null,

  messages: [],
  hasNextPage: false,
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,

  fetchNextPage: () => {},
  refresh: () => {},

  _setFromQuery: (data) => set(data),
}));