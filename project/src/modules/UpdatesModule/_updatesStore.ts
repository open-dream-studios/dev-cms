// project/src/modules/UpdatesModule/_store.ts
import { createStore } from "@/store/createStore";

export const updateState = {
  isLoading: false,
  selectedTab: "overview" as "overview" | "analytics" | "settings",
  filtersOpen: false,
  selectedUserId: null as number | null,
  refreshKey: 0,
};

export const useUpdateStore = createStore(updateState);

// UPDATE
// useDashboardStore.getState().set({
//   selectedTab: "analytics",
// });

// UPDATE PREV
// useDashboardStore.getState().set((state) => ({
//   refreshKey: state.refreshKey + 1,
// }));

// RESET SINGLE
// useDashboardStore.getState().resetKey("selectedUserId");

// RESET ALL
// useDashboardStore.getState().reset();
