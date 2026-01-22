// project/src/modules/EstimationModule/_store/estimations.store.ts
import { createStore } from "@/store/createStore";
import { EstimationFactDefinition } from "@open-dream/shared";

const ROOT_ID = "__root__";
export const useEstimationFactsUIStore = createStore({
  selectedFolderId: null as null | number,
  draggingFolderId: null as null | string,
  draggingFact: null as null | EstimationFactDefinition,
  isCanvasGhostActive: false,
  hoveredFolderId: null as string | null,
  openFolders: new Set<string>([ROOT_ID]),
});
