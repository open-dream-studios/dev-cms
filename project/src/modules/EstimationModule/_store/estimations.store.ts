// project/src/modules/EstimationModule/_store/estimations.store.ts
import { createStore } from "@/store/createStore";
import { EstimationFactDefinition } from "@open-dream/shared";

export const useEstimationFactsUIStore = createStore({
  selectedFolderId: null as null | number,
  draggingFolderId: null as null | string,
  draggingFact: null as null | EstimationFactDefinition,
  isCanvasGhostActive: false,
});
