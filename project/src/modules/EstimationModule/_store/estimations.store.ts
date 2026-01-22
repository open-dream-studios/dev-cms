// project/src/modules/EstimationModule/_store/estimations.store.ts
import { createStore } from "@/store/createStore";

export const useEstimationFactsUIStore = createStore({
  selectedFolderId: null as null | number,
});
