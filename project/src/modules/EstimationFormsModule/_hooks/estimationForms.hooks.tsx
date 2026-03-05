// project/src/modules/EstimationFormsModule/_hooks/estimationForms.hooks.tsx
"use client";
import { useContext, useEffect, useMemo, useRef } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useEstimationForms } from "@/contexts/queryContext/queries/estimationForms/estimationForms";
import {
  addChoiceCase,
  addPaletteNodeToForm,
  createFormBuild,
  deleteFormBuild,
  duplicateFormBuild,
  hydrateFormBuilds,
  markSavingState,
  renameFormBuild,
  ensureSelectedForm,
  getSelectedForm,
  getSelectedNode,
  moveNode,
  removeChoiceCase,
  removeNode,
  toggleCollapsedNode,
  upsertFormBuildInState,
  updateNode,
  useEstimationFormsUIStore,
} from "../_store/estimationForms.store";
import { validateEstimationFormGraph } from "../_helpers/estimationForms.helpers";

export function useEstimationFormsModule() {
  const {
    formBuilds,
    hasHydratedFromBackend,
    selectedFormId,
    selectedNodeId,
    collapsedNodeIds,
    search,
    showErrors,
    isSaving,
    saveError,
    lastSavedAt,
    setSelectedFormId,
    setSelectedNodeId,
    setSearch,
    setShowErrors,
  } = useEstimationFormsUIStore();
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const isLoggedIn = !!currentUser;

  const {
    estimationFormsData,
    isLoadingEstimationForms,
    fetchSingleForm,
    upsertEstimationForm,
    updateFormStatus,
    deleteEstimationForm: deleteEstimationFormRemote,
  } = useEstimationForms(isLoggedIn, currentProjectId);

  ensureSelectedForm();

  const docHashesRef = useRef<Record<string, string>>({});
  const saveTimerRef = useRef<number | null>(null);
  const inflightSaveRef = useRef(false);
  const pendingSaveIdsRef = useRef<Set<string>>(new Set());
  const upsertRef = useRef(upsertEstimationForm);

  useEffect(() => {
    upsertRef.current = upsertEstimationForm;
  }, [upsertEstimationForm]);

  const getDocSnapshotSignature = (doc: {
    name: string;
    description: string;
    status: string;
    root: unknown;
  }) =>
    JSON.stringify({
      name: doc.name,
      description: doc.description || "",
      status: doc.status,
      root: doc.root,
    });

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

  useEffect(() => {
    if (!estimationFormsData) return;
    const mapped = estimationFormsData.map((doc) => ({
      id: doc.id,
      name: doc.name,
      description: doc.description || "",
      status: doc.status,
      version: doc.version,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      root: doc.root as any,
    }));
    hydrateFormBuilds(mapped);
    docHashesRef.current = Object.fromEntries(
      mapped.map((doc) => [doc.id, getDocSnapshotSignature(doc)])
    );
  }, [estimationFormsData]);

  useEffect(() => {
    if (!selectedFormId || !hasHydratedFromBackend) return;
    if (!currentProjectId || !isLoggedIn) return;
    if (docHashesRef.current[selectedFormId]) return;
    void fetchSingleForm(selectedFormId).then((remote) => {
      if (!remote) return;
      const mapped = {
        id: remote.id,
        name: remote.name,
        description: remote.description || "",
        status: remote.status,
        version: remote.version,
        created_at: remote.created_at,
        updated_at: remote.updated_at,
        root: remote.root as any,
      };
      upsertFormBuildInState(mapped);
      docHashesRef.current[mapped.id] = getDocSnapshotSignature(mapped);
    });
  }, [selectedFormId, hasHydratedFromBackend, currentProjectId, isLoggedIn]);

  useEffect(() => {
    if (!hasHydratedFromBackend) return;
    if (!currentProjectId || !isLoggedIn) return;
    if (!formBuilds.length) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      if (inflightSaveRef.current) return;
      const changed = formBuilds.filter(
        (doc) =>
          !pendingSaveIdsRef.current.has(doc.id) &&
          docHashesRef.current[doc.id] !== getDocSnapshotSignature(doc)
      );
      if (!changed.length) return;

      inflightSaveRef.current = true;
      pendingSaveIdsRef.current = new Set(changed.map((d) => d.id));
      markSavingState({ isSaving: true, saveError: null });
      try {
        for (const doc of changed) {
          await upsertRef.current({
            form_id: doc.id,
            name: doc.name,
            description: doc.description,
            status: doc.status,
            root: doc.root as any,
            validation: validateEstimationFormGraph(doc.root as any),
            bump_version: false,
          });
          docHashesRef.current[doc.id] = getDocSnapshotSignature(doc);
        }
        markSavingState({
          isSaving: false,
          saveError: null,
          lastSavedAt: new Date().toISOString(),
        });
      } catch (e: any) {
        markSavingState({
          isSaving: false,
          saveError: e?.message || "Failed to save",
        });
      } finally {
        pendingSaveIdsRef.current.clear();
        inflightSaveRef.current = false;
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [
    formBuilds,
    hasHydratedFromBackend,
    currentProjectId,
    isLoggedIn,
  ]);

  const createFormBuildSynced = async (name = "New Form") => {
    createFormBuild(name);
  };

  const deleteFormBuildSynced = async (formId: string) => {
    deleteFormBuild(formId);
    try {
      await deleteEstimationFormRemote(formId);
    } catch {
      // Keep optimistic UI; backend retry can occur on next load.
    }
  };

  const setFormStatusSynced = async (
    formId: string,
    status: "draft" | "published" | "archived"
  ) => {
    const doc = formBuilds.find((d) => d.id === formId);
    if (!doc) return;
    upsertFormBuildInState({ ...doc, status, updated_at: new Date().toISOString() });
    await updateFormStatus(formId, status);
  };

  return {
    formBuilds,
    filteredFormBuilds,
    selectedForm,
    selectedNode,
    selectedNodeId,
    collapsedNodeIds,
    validation,
    search,
    showErrors,
    isSaving,
    saveError,
    lastSavedAt,
    isLoadingEstimationForms,

    setSearch,
    setShowErrors,
    setSelectedFormId,
    setSelectedNodeId,

    createFormBuild: createFormBuildSynced,
    deleteFormBuild: deleteFormBuildSynced,
    duplicateFormBuild,
    renameFormBuild,
    setFormStatus: setFormStatusSynced,
    addPaletteNodeToForm,
    moveNode,
    addChoiceCase,
    removeChoiceCase,
    toggleCollapsedNode,
    removeNode,
    updateNode,
  };
}
