// project/src/modules/EstimationModule/_store/estimations.store.ts
import { createStore } from "@/store/createStore";
import { EstimationFactDefinition, VariableScope } from "@open-dream/shared";
import { Value } from "../EstimationVariables/types";

const ROOT_ID = "__root__";

export type VariableKey = {
  var_key: string;
  var_id: string | null;
  var_type: VariableScope;
};

export type PendingVariableTarget =
  | {
      kind: "condition-left";
      set: (v: Value) => void;
    }
  | {
      kind: "condition-right";
      set: (v: Value) => void;
    }
  | {
      kind: "return";
      set: (v: Value) => void;
    };

export const useEstimationFactsUIStore = createStore({
  selectedFolderId: null as null | number,
  draggingFolderId: null as null | string,
  draggingFact: null as null | EstimationFactDefinition,
  isCanvasGhostActive: false,
  hoveredFolderId: null as string | null,
  openFolders: new Set<string>([ROOT_ID]),

  variableView: "fact" as VariableScope,
  editingFact: null as null | VariableKey,
  editingVariable: null as null | VariableKey,
  pendingVariableTarget: null as PendingVariableTarget | null,
  selectingVariableReturn: null as null | {
    selector_id: string; // == expression_id
    type: "variable" | "statement";
    target: "condition-left" | "condition-right" | "return";
  },
});

export const resetVariableUI = () =>
  useEstimationFactsUIStore.getState().set({
    editingVariable: null,
    editingFact: null,
    selectingVariableReturn: null, 
  });
