// src/modules/GoogleModule/GmailModule/_gmailStore.ts
import { createStore } from "@/store/createStore";
import { GmailRequestType, MessageDetail } from "@open-dream/shared";

export const useGmailDataStore = createStore({
  label: null as GmailRequestType | null,
  messages: [] as any[],
  hasNextPage: false,
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  fetchNextPage: (() => {}) as () => void,
  refresh: (() => {}) as () => void,
});

export const useGmailUIStore = createStore({
  selectedGmailTab: "INBOX" as GmailRequestType,
  selectedId: null as string | null,
  detail: null as MessageDetail | null,
  search: "",
  showHeaders: false,
  photoError: false,
  isComposing: false,
  isReplying: false,
});