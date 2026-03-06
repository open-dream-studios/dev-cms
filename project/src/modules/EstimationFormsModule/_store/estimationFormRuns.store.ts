// project/src/modules/EstimationFormsModule/_store/estimationFormRuns.store.ts
import { createStore } from "@/store/createStore";

export const useEstimationFormRunsUIStore = createStore({
  estimationFormRunsLeftBarOpen: true,
  search: "",
  selectedFormId: "" as string,
  activeFormNodeId: "" as string,
  selectedCaseByFormId: {} as Record<string, Record<string, string>>,
  showResults: false,
  flatAdjustment: 0,
  percentAdjustment: 0,
});

export const setSelectedCaseForForm = (
  formId: string,
  choiceId: string,
  caseFormId: string
) => {
  const state = useEstimationFormRunsUIStore.getState();
  state.set((s) => ({
    selectedCaseByFormId: {
      ...s.selectedCaseByFormId,
      [formId]: {
        ...(s.selectedCaseByFormId[formId] || {}),
        [choiceId]: caseFormId,
      },
    },
  }));
};

export const setSelectedCasesForForm = (
  formId: string,
  next: Record<string, string>
) => {
  const state = useEstimationFormRunsUIStore.getState();
  state.set((s) => ({
    selectedCaseByFormId: {
      ...s.selectedCaseByFormId,
      [formId]: next,
    },
  }));
};

export const resetRunViewForForm = (formId: string, rootFormNodeId: string) => {
  const state = useEstimationFormRunsUIStore.getState();
  state.set({
    selectedFormId: formId,
    activeFormNodeId: rootFormNodeId,
    showResults: false,
    flatAdjustment: 0,
    percentAdjustment: 0,
  });
};
