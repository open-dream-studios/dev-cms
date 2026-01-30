// project/src/modules/EstimationModule/_store/estimations.store.ts
import { createStore } from "@/store/createStore";
import { EstimationFactDefinition } from "@open-dream/shared";

export type VariableView = "facts" | "geometric" | "project";
const ROOT_ID = "__root__";

export const useEstimationFactsUIStore = createStore({
  selectedFolderId: null as null | number,
  draggingFolderId: null as null | string,
  draggingFact: null as null | EstimationFactDefinition,
  isCanvasGhostActive: false,
  hoveredFolderId: null as string | null,
  openFolders: new Set<string>([ROOT_ID]),

  // variables
  variableView: "facts" as VariableView,
  isSelectingVariableReturn: false,
  isEditingVariableReturn: false,
});
