// project/src/modules/EstimationFormsModule/_hooks/estimationFormRuns.hooks.tsx
"use client";

import { useContext, useEffect, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useEstimationForms } from "@/contexts/queryContext/queries/estimationForms/estimationForms";
import {
  calculateRunResult,
  findFormNodeById,
  findParentFormId,
  formatMoney,
  getChoiceStepsDepthFirst,
  getFormSubtreeCompletion,
  getRunnableForms,
  isRunComplete,
  pruneAnswersToReachableChoices,
  validateRunnableFormGraph,
} from "../_helpers/estimationFormRuns.helpers";
import {
  resetRunViewForForm,
  setSelectedCaseForForm,
  setSelectedCasesForForm,
  useEstimationFormRunsUIStore,
} from "../_store/estimationFormRuns.store";

export function useEstimationFormRunsModule() {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const isLoggedIn = !!currentUser;

  const {
    estimationFormsData,
    isLoadingEstimationForms,
  } = useEstimationForms(isLoggedIn, currentProjectId);

  const {
    search,
    selectedFormId,
    activeFormNodeId,
    selectedCaseByFormId,
    showResults,
    flatAdjustment,
    percentAdjustment,
    setSearch,
    setActiveFormNodeId,
    setShowResults,
    setFlatAdjustment,
    setPercentAdjustment,
  } = useEstimationFormRunsUIStore();

  const runnableForms = useMemo(() => {
    const forms = estimationFormsData || [];
    return getRunnableForms(forms);
  }, [estimationFormsData]);

  useEffect(() => {
    if (!runnableForms.length) return;
    const formExists = runnableForms.some((f) => f.id === selectedFormId);
    if (formExists) return;
    resetRunViewForForm(runnableForms[0].id, runnableForms[0].root.id);
  }, [runnableForms, selectedFormId]);

  const filteredForms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return runnableForms;
    return runnableForms.filter((doc) => {
      const hay = `${doc.name} ${(doc as any).description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [runnableForms, search]);

  const selectedForm = useMemo(
    () => runnableForms.find((f) => f.id === selectedFormId) || null,
    [runnableForms, selectedFormId]
  );

  const selectedCaseByChoiceId = useMemo(
    () => (selectedForm ? selectedCaseByFormId[selectedForm.id] || {} : {}),
    [selectedCaseByFormId, selectedForm]
  );

  const activeFormNode = useMemo(() => {
    if (!selectedForm) return null;
    return findFormNodeById(selectedForm.root, activeFormNodeId || selectedForm.root.id);
  }, [selectedForm, activeFormNodeId]);

  const choiceSteps = useMemo(() => {
    if (!selectedForm) return [];
    return getChoiceStepsDepthFirst(selectedForm.root, selectedCaseByChoiceId);
  }, [selectedForm, selectedCaseByChoiceId]);

  const runComplete = useMemo(() => {
    if (!selectedForm) return false;
    return isRunComplete(selectedForm.root, selectedCaseByChoiceId);
  }, [selectedForm, selectedCaseByChoiceId]);

  const runResult = useMemo(() => {
    if (!selectedForm || !runComplete) return null;
    return calculateRunResult(
      selectedForm.root,
      selectedCaseByChoiceId,
      percentAdjustment,
      flatAdjustment
    );
  }, [selectedForm, selectedCaseByChoiceId, runComplete, percentAdjustment, flatAdjustment]);

  const selectedValidation = useMemo(() => {
    if (!selectedForm) return null;
    return validateRunnableFormGraph(selectedForm.root);
  }, [selectedForm]);

  const onSelectRunnableForm = (formId: string) => {
    const form = runnableForms.find((f) => f.id === formId);
    if (!form) return;
    resetRunViewForForm(form.id, form.root.id);
  };

  const onNavigateToFormNode = (formNodeId: string) => {
    if (!selectedForm) return;
    const found = findFormNodeById(selectedForm.root, formNodeId);
    if (!found) return;
    setActiveFormNodeId(found.id);
    setShowResults(false);
  };

  const onNavigateUp = () => {
    if (!selectedForm || !activeFormNode) return;
    const parentId = findParentFormId(selectedForm.root, activeFormNode.id);
    if (parentId) setActiveFormNodeId(parentId);
  };

  const onChooseCase = (choiceId: string, caseFormId: string) => {
    if (!selectedForm) return;
    setSelectedCaseForForm(selectedForm.id, choiceId, caseFormId);

    const next = pruneAnswersToReachableChoices(selectedForm.root, {
      ...selectedCaseByChoiceId,
      [choiceId]: caseFormId,
    });

    setSelectedCasesForForm(selectedForm.id, next);

    const selectedOption = findFormNodeById(selectedForm.root, caseFormId);
    const hasNonConstChildren = !!selectedOption?.children?.some(
      (child) => child.kind !== "const"
    );
    if (hasNonConstChildren) {
      setActiveFormNodeId(caseFormId);
    }

    setShowResults(false);
  };

  const onRunEstimation = () => {
    if (!runComplete) return;
    setShowResults(true);
  };

  const completionForActiveForm = useMemo(() => {
    if (!activeFormNode) return { complete: false, totalChoices: 0, answeredChoices: 0 };
    return getFormSubtreeCompletion(activeFormNode, selectedCaseByChoiceId);
  }, [activeFormNode, selectedCaseByChoiceId]);

  return {
    isLoadingEstimationForms,
    runnableForms,
    filteredForms,
    selectedForm,
    selectedCaseByChoiceId,
    activeFormNode,
    choiceSteps,
    runComplete,
    runResult,
    completionForActiveForm,
    selectedValidation,

    search,
    showResults,
    flatAdjustment,
    percentAdjustment,

    setSearch,
    setShowResults,
    setFlatAdjustment,
    setPercentAdjustment,

    onSelectRunnableForm,
    onNavigateToFormNode,
    onNavigateUp,
    onChooseCase,
    onRunEstimation,

    formatMoney,
  };
}
