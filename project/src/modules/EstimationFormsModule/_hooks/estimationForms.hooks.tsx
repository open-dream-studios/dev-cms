// project/src/modules/EstimationFormsModule/_hooks/estimationForms.hooks.tsx
"use client";
import { useMemo } from "react";
import {
  addChoiceCase,
  addPaletteNodeToForm,
  createFormBuild,
  deleteFormBuild,
  duplicateFormBuild,
  renameFormBuild,
  ensureSelectedForm,
  getSelectedForm,
  getSelectedNode,
  moveNode,
  removeChoiceCase,
  removeNode,
  toggleCollapsedNode,
  updateNode,
  useEstimationFormsUIStore,
} from "../_store/estimationForms.store";
import { validateEstimationFormGraph } from "../_helpers/estimationForms.helpers";

export function useEstimationFormsModule() {
  const {
    formBuilds,
    selectedFormId,
    selectedNodeId,
    collapsedNodeIds,
    search,
    setSelectedFormId,
    setSelectedNodeId,
    setSearch,
  } = useEstimationFormsUIStore();

  ensureSelectedForm();

  const selectedForm = useMemo(
    () => getSelectedForm({ formBuilds, selectedFormId }),
    [formBuilds, selectedFormId],
  );

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !selectedForm) return null;
    return getSelectedNode();
  }, [selectedNodeId, selectedForm]);

  const validation = useMemo(
    () =>
      selectedForm
        ? validateEstimationFormGraph(selectedForm.root)
        : { valid: true, errors: [] },
    [selectedForm],
  );

  const filteredFormBuilds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return formBuilds;

    return formBuilds.filter((doc) => {
      const haystack = `${doc.name} ${doc.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [formBuilds, search]);

  return {
    formBuilds,
    filteredFormBuilds,
    selectedForm,
    selectedNode,
    selectedNodeId,
    collapsedNodeIds,
    validation,
    search,

    setSearch,
    setSelectedFormId,
    setSelectedNodeId,

    createFormBuild,
    deleteFormBuild,
    duplicateFormBuild,
    renameFormBuild,
    addPaletteNodeToForm,
    moveNode,
    addChoiceCase,
    removeChoiceCase,
    toggleCollapsedNode,
    removeNode,
    updateNode,
  };
}
