// project/src/modules/EstimationFormsModule/_store/estimationForms.store.ts
import { createStore } from "@/store/createStore";
import {
  addCaseToChoice,
  addNodeToForm,
  createChoiceNode,
  createConstNode,
  createFormNode,
  createId,
  createStarterFormDocument,
  EstimationBuilderFormDocument,
  EstimationBuilderFormGraph,
  EstimationBuilderNode,
  findNodeById,
  moveNodeBetweenForms,
  nowIso,
  removeCaseFromChoice,
  removeNodeById,
  updateNodeById,
} from "../_helpers/estimationForms.helpers";

export type NodePaletteKind = "form" | "choice" | "const";

export const useEstimationFormsUIStore = createStore({
  formBuilds: [] as EstimationBuilderFormDocument[],
  hasHydratedFromBackend: false,
  selectedFormId: "" as string,
  selectedNodeId: null as string | null,
  collapsedNodeIds: [] as string[],
  search: "",
  estimationFormsLeftBarOpen: true,
  showErrors: false,
  isSaving: false,
  saveError: null as string | null,
  lastSavedAt: null as string | null,
});

const touchDocument = (
  formBuilds: EstimationBuilderFormDocument[],
  docId: string,
  updater: (doc: EstimationBuilderFormDocument) => EstimationBuilderFormDocument
) =>
  formBuilds.map((doc) =>
    doc.id === docId ? { ...updater(doc), updated_at: nowIso() } : doc
  );

export const ensureSelectedForm = () => {
  const state = useEstimationFormsUIStore.getState();
  if (state.selectedFormId) return;
  if (!state.formBuilds.length) return;
  state.setSelectedFormId(state.formBuilds[0].id);
};

export const hydrateFormBuilds = (formBuilds: EstimationBuilderFormDocument[]) => {
  const state = useEstimationFormsUIStore.getState();
  const selectedStillExists = formBuilds.some(
    (doc) => doc.id === state.selectedFormId
  );
  const nextSelectedId = selectedStillExists
    ? state.selectedFormId
    : (formBuilds[0]?.id ?? "");

  state.set({
    formBuilds,
    hasHydratedFromBackend: true,
    selectedFormId: nextSelectedId,
    selectedNodeId: nextSelectedId
      ? state.selectedNodeId || formBuilds.find((d) => d.id === nextSelectedId)?.root.id || null
      : null,
  });
};

export const upsertFormBuildInState = (doc: EstimationBuilderFormDocument) => {
  const state = useEstimationFormsUIStore.getState();
  const existing = state.formBuilds.find((d) => d.id === doc.id);
  if (existing) {
    state.setFormBuilds(
      state.formBuilds.map((d) => (d.id === doc.id ? { ...d, ...doc } : d))
    );
    return;
  }
  state.set((s) => ({ formBuilds: [doc, ...s.formBuilds] }));
};

export const markSavingState = (patch: {
  isSaving?: boolean;
  saveError?: string | null;
  lastSavedAt?: string | null;
}) => {
  const state = useEstimationFormsUIStore.getState();
  state.set({
    isSaving: patch.isSaving ?? state.isSaving,
    saveError:
      patch.saveError === undefined ? state.saveError : patch.saveError,
    lastSavedAt:
      patch.lastSavedAt === undefined ? state.lastSavedAt : patch.lastSavedAt,
  });
};

export const getSelectedForm = (state: {
  formBuilds: EstimationBuilderFormDocument[];
  selectedFormId: string;
}) => state.formBuilds.find((doc) => doc.id === state.selectedFormId) ?? null;

export const createFormBuild = (name = "New Form") => {
  const state = useEstimationFormsUIStore.getState();
  const next = createStarterFormDocument(name);
  state.set((s) => ({
    formBuilds: [next, ...s.formBuilds],
    selectedFormId: next.id,
    selectedNodeId: next.root.id,
  }));
};

export const deleteFormBuild = (formId: string) => {
  const state = useEstimationFormsUIStore.getState();
  state.set((s) => {
    const filtered = s.formBuilds.filter((doc) => doc.id !== formId);
    const nextSelected =
      s.selectedFormId === formId ? filtered[0]?.id ?? "" : s.selectedFormId;

    return {
      formBuilds: filtered,
      selectedFormId: nextSelected,
      selectedNodeId: nextSelected ? s.selectedNodeId : null,
    };
  });
};

export const duplicateFormBuild = (formId: string) => {
  const state = useEstimationFormsUIStore.getState();
  const existing = state.formBuilds.find((doc) => doc.id === formId);
  if (!existing) return;

  const cloned: EstimationBuilderFormDocument = {
    ...structuredClone(existing),
    id: createId("doc"),
    name: `${existing.name} Copy`,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  state.set((s) => ({
    formBuilds: [cloned, ...s.formBuilds],
    selectedFormId: cloned.id,
    selectedNodeId: cloned.root.id,
  }));
};

export const renameFormBuild = (formId: string, name: string) => {
  const nextName = name.trim();
  if (!nextName) return;

  const state = useEstimationFormsUIStore.getState();
  state.set((s) => ({
    formBuilds: touchDocument(s.formBuilds, formId, (doc) => ({
      ...doc,
      name: nextName,
    })),
  }));
};

const updateRoot = (
  doc: EstimationBuilderFormDocument,
  root: EstimationBuilderFormGraph
) => ({
  ...doc,
  root,
});

export const addPaletteNodeToForm = (
  formId: string,
  targetFormId: string,
  kind: NodePaletteKind,
  index?: number
) => {
  const state = useEstimationFormsUIStore.getState();

  const nodeToAdd: EstimationBuilderNode =
    kind === "form"
      ? createFormNode(`Sub List`)
      : kind === "choice"
      ? createChoiceNode("Multiple Choice")
      : createConstNode(`Total`, 0);

  state.set((s) => ({
    formBuilds: touchDocument(s.formBuilds, formId, (doc) =>
      updateRoot(doc, addNodeToForm(doc.root, targetFormId, nodeToAdd, index))
    ),
    selectedNodeId: nodeToAdd.id,
  }));
};

export const moveNode = (
  formId: string,
  nodeId: string,
  fromFormId: string,
  toFormId: string,
  toIndex?: number
) => {
  const state = useEstimationFormsUIStore.getState();
  state.set((s) => ({
    formBuilds: touchDocument(s.formBuilds, formId, (doc) =>
      updateRoot(
        doc,
        moveNodeBetweenForms(doc.root, nodeId, fromFormId, toFormId, toIndex)
      )
    ),
    selectedNodeId: nodeId,
  }));
};

export const addChoiceCase = (formId: string, choiceId: string) => {
  const state = useEstimationFormsUIStore.getState();
  state.set((s) => ({
    formBuilds: touchDocument(s.formBuilds, formId, (doc) =>
      updateRoot(doc, addCaseToChoice(doc.root, choiceId))
    ),
  }));
};

export const removeChoiceCase = (
  formId: string,
  choiceId: string,
  caseFormId: string
) => {
  const state = useEstimationFormsUIStore.getState();
  state.set((s) => ({
    formBuilds: touchDocument(s.formBuilds, formId, (doc) =>
      updateRoot(doc, removeCaseFromChoice(doc.root, choiceId, caseFormId))
    ),
    collapsedNodeIds: s.collapsedNodeIds.filter((id) => id !== caseFormId),
    selectedNodeId:
      s.selectedNodeId === caseFormId ? choiceId : s.selectedNodeId,
  }));
};

export const toggleCollapsedNode = (nodeId: string) => {
  const state = useEstimationFormsUIStore.getState();
  const set = new Set(state.collapsedNodeIds);
  if (set.has(nodeId)) set.delete(nodeId);
  else set.add(nodeId);
  state.setCollapsedNodeIds(Array.from(set));
};

export const removeNode = (formId: string, nodeId: string) => {
  const state = useEstimationFormsUIStore.getState();
  state.set((s) => ({
    formBuilds: touchDocument(s.formBuilds, formId, (doc) =>
      updateRoot(
        doc,
        removeNodeById(doc.root, nodeId) as EstimationBuilderFormGraph
      )
    ),
    selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
    collapsedNodeIds: s.collapsedNodeIds.filter((id) => id !== nodeId),
  }));
};

export const updateNode = (
  formId: string,
  nodeId: string,
  patch: {
    name?: string;
    question?: string;
    value?: number;
  }
) => {
  const state = useEstimationFormsUIStore.getState();

  state.set((s) => ({
    formBuilds: touchDocument(s.formBuilds, formId, (doc) =>
      updateRoot(
        doc,
        updateNodeById(doc.root, nodeId, (node) => {
          if (node.kind === "const") {
            return {
              ...node,
              name: patch.name ?? node.name,
              question: patch.question ?? node.question,
              value: patch.value ?? node.value,
            };
          }

          return {
            ...node,
            name: patch.name ?? node.name,
            question: patch.question ?? node.question,
          };
        }) as EstimationBuilderFormGraph
      )
    ),
  }));
};

export const getSelectedNode = () => {
  const state = useEstimationFormsUIStore.getState();
  const doc = getSelectedForm(state);
  if (!doc || !state.selectedNodeId) return null;
  return findNodeById(doc.root, state.selectedNodeId);
};
