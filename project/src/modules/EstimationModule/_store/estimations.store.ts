// project/src/modules/EstimationModule/_store/estimations.store.ts
import { createStore } from "@/store/createStore";
import { EstimationFactDefinition, VariableScope } from "@open-dream/shared";
import { EditorMode, Value } from "../EstimationVariables/types";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";

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
  draggingFact: null as null | EstimationFactDefinition,
  draggingProcess: null as EstimationProcess | null,
  isCanvasGhostActive: false,
  variableView: "fact" as VariableScope,
  editingFact: null as null | VariableKey,
  editingVariable: null as null | VariableKey,
  pendingVariableTarget: null as PendingVariableTarget | null,
  selectingVariableReturn: null as null | {
    selector_id: string; // == expression_id
    type: "variable" | "statement";
    target: "condition-left" | "condition-right" | "return";
  },
  editingConditional: null as null | string,
  editingAdjustment: null as null | string,
  editingIfTreeType: null as null | EditorMode,

  runInputsOpen: false,
  factInputs: {} as Record<string, string>,
  showEstimationReport: false,
  latestReport: null as null | Record<string, any>,
});

export const resetVariableUI = () =>
  useEstimationFactsUIStore.getState().set({
    editingVariable: null,
    editingFact: null,
    selectingVariableReturn: null,
    editingConditional: null,
    editingIfTreeType: null,
    editingAdjustment: null,
  });

export const openVariableIfTree = (variable: VariableKey) =>
  useEstimationFactsUIStore.getState().set({
    editingVariable: variable,
    editingConditional: null,
    editingAdjustment: null,
    editingIfTreeType: "variable",
    selectingVariableReturn: null,
    editingFact: null,
  });

export const openConditionalIfTree = (nodeId: string | number) =>
  useEstimationFactsUIStore.getState().set({
    editingVariable: null,
    editingConditional: String(nodeId),
    editingAdjustment: null,
    editingIfTreeType: "conditional",
    selectingVariableReturn: null,
    editingFact: null,
  });

export const openAdjustmentIfTree = (nodeId: string | number) =>
  useEstimationFactsUIStore.getState().set({
    editingVariable: null,
    editingConditional: null,
    editingAdjustment: String(nodeId),
    editingIfTreeType: "adjustment",
    selectingVariableReturn: null,
    editingFact: null,
  });

export const setFactInputValue = (fact_key: string, value: string) =>
  useEstimationFactsUIStore.getState().set((s) => ({
    factInputs: {
      ...s.factInputs,
      [fact_key]: value,
    },
  }));

export const getFactInputValue = (fact_key: string) =>
  useEstimationFactsUIStore.getState().factInputs[fact_key] ?? "";
