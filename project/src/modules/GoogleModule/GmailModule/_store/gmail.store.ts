// src/modules/GoogleModule/GmailModule/_store/gmail.store.ts
import { createStore } from "@/store/createStore";
import { GmailLabel, MessageDetail } from "@open-dream/shared";

export const useGmailDataStore = createStore({
  label: null as GmailLabel | null,
  messages: [] as any[],
  hasNextPage: false,
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  fetchNextPage: (() => {}) as () => void,
  refresh: (() => {}) as () => void,
});

export const useGmailUIStore = createStore({
  selectedGmailTab: "INBOX" as GmailLabel,
  selectedId: null as string | null,
  detail: null as MessageDetail | null,
  search: "",
  showHeaders: false,
  photoError: false,
  isComposing: false,
  isReplying: false,
});