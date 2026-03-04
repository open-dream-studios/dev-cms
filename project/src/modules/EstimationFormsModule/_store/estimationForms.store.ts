// project/src/modules/EstimationFormsModule/_store/estimationForms.store.ts
import { createStore } from "@/store/createStore";
// import { EstimationFactDefinition, VariableScope } from "@open-dream/shared";
// import { EditorMode, Value } from "../EstimationVariables/types";
// import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
// import { useCurrentDataStore } from "@/store/currentDataStore";
// import { useFoldersCurrentDataStore } from "@/modules/_util/Folders/_store/folders.store";

export const useEstimationFormstUIStore = createStore({
  variable1: null as string | null,
});

// export type VariableKey = {
//   var_key: string;
//   var_id: string | null;
//   var_type: VariableScope;
// };

// export type PendingVariableTarget =
//   | {
//       kind: "condition-left";
//       set: (v: Value) => void;
//     }
//   | {
//       kind: "condition-right";
//       set: (v: Value) => void;
//     }
//   | {
//       kind: "return";
//       set: (v: Value) => void;
//     };

// export const resetVariableUI = () => {
//   const { setCurrentProcessRunId } = useCurrentDataStore.getState();
//   setCurrentProcessRunId(null);
//   return useEstimationsUIStore.getState().set({
//     editingVariable: null,
//     editingFact: null,
//     selectingVariableReturn: null,
//     editingConditional: null,
//     editingIfTreeType: null,
//     editingAdjustment: null,

//     runInputsOpen: false,
//     factInputs: {},
//     showEstimationReport: false,
//     latestReport: null,
//   });
// };

// export const openVariableIfTree = (variable: VariableKey) =>
//   useEstimationsUIStore.getState().set({
//     editingVariable: variable,
//     editingConditional: null,
//     editingAdjustment: null,
//     editingIfTreeType: "variable",
//     selectingVariableReturn: null,
//     editingFact: null,
//   });

// export const openConditionalIfTree = (nodeId: string | number) =>
//   useEstimationsUIStore.getState().set({
//     editingVariable: null,
//     editingConditional: String(nodeId),
//     editingAdjustment: null,
//     editingIfTreeType: "conditional",
//     selectingVariableReturn: null,
//     editingFact: null,
//   });

// export const openAdjustmentIfTree = (nodeId: string | number) =>
//   useEstimationsUIStore.getState().set({
//     editingVariable: null,
//     editingConditional: null,
//     editingAdjustment: String(nodeId),
//     editingIfTreeType: "adjustment",
//     selectingVariableReturn: null,
//     editingFact: null,
//   });

// export const setFactInputValue = (fact_key: string, value: string) =>
//   useEstimationsUIStore.getState().set((s) => ({
//     factInputs: {
//       ...s.factInputs,
//       [fact_key]: value,
//     },
//   }));

// export const getFactInputValue = (fact_key: string) =>
//   useEstimationsUIStore.getState().factInputs[fact_key] ?? "";
