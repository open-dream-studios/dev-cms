// project/src/modules/EstimationFormsModule/_helpers/estimationForms.helpers.ts
import {
  EstimationChoiceNode,
  EstimationConstNode,
  EstimationFormGraph,
  EstimationFormNode,
  EstimationNodeKind,
  EstimationNodeId,
  EstimationValidationResult,
} from "@open-dream/shared";

export type EstimationBuilderNode =
  | (EstimationFormNode & { question?: string })
  | (EstimationChoiceNode & { question?: string })
  | (EstimationConstNode & { question?: string });

export type EstimationBuilderFormGraph = Omit<EstimationFormGraph, "children"> & {
  question?: string;
  children: EstimationBuilderNode[];
};

export type EstimationBuilderFormNode = Extract<EstimationBuilderNode, { kind: "form" }>;
export type EstimationBuilderChoiceNode = Extract<EstimationBuilderNode, { kind: "choice" }>;
export type EstimationBuilderConstNode = Extract<EstimationBuilderNode, { kind: "const" }>;

export type EstimationBuilderFormDocument = {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  version?: number;
  created_at: string;
  updated_at: string;
  root: EstimationBuilderFormGraph;
};

export const estimationNodeKindTitleMap: Record<EstimationNodeKind, string> = {
  form: "list",
  choice: "choice",
  const: "cost",
};

export const createId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const nowIso = () => new Date().toISOString();

export const createFormNode = (name = "New Form"): EstimationBuilderFormNode => ({
  id: createId("form"),
  kind: "form",
  name,
  question: "",
  children: [],
});

export const createChoiceNode = (
  name = "Choose an Option",
): EstimationBuilderChoiceNode => ({
  id: createId("choice"),
  kind: "choice",
  name,
  question: "",
  cases: [createFormNode("Option A"), createFormNode("Option B")],
});

export const createConstNode = (
  name = "Line Item",
  value = 0,
): EstimationBuilderConstNode => ({
  id: createId("const"),
  kind: "const",
  name,
  question: "",
  value,
});

export const createStarterFormDocument = (
  name = "Bathroom Remodel - Base",
): EstimationBuilderFormDocument => ({
  id: createId("doc"),
  name,
  description: "Base template for remodel estimation logic",
  status: "draft",
  created_at: nowIso(),
  updated_at: nowIso(),
  root: {
    ...createFormNode(name),
    children: [],
  },
});

export const findNodeById = (
  node: EstimationBuilderNode,
  nodeId: EstimationNodeId,
): EstimationBuilderNode | null => {
  if (node.id === nodeId) return node;

  if (node.kind === "form") {
    for (const child of node.children) {
      const found = findNodeById(child as EstimationBuilderNode, nodeId);
      if (found) return found;
    }
  }

  if (node.kind === "choice") {
    for (const formCase of node.cases) {
      const found = findNodeById(formCase as EstimationBuilderNode, nodeId);
      if (found) return found;
    }
  }

  return null;
};

export const updateNodeById = (
  node: EstimationBuilderNode,
  nodeId: EstimationNodeId,
  updater: (target: EstimationBuilderNode) => EstimationBuilderNode,
): EstimationBuilderNode => {
  if (node.id === nodeId) return updater(node);

  if (node.kind === "form") {
    return {
      ...node,
      children: node.children.map((child) =>
        updateNodeById(child as EstimationBuilderNode, nodeId, updater),
      ),
    };
  }

  if (node.kind === "choice") {
    return {
      ...node,
      cases: node.cases.map(
        (formCase) =>
          updateNodeById(
            formCase as EstimationBuilderNode,
            nodeId,
            updater,
          ) as EstimationBuilderFormNode,
      ),
    };
  }

  return node;
};

export const removeNodeById = (
  node: EstimationBuilderNode,
  nodeId: EstimationNodeId,
): EstimationBuilderNode => {
  if (node.kind === "form") {
    return {
      ...node,
      children: node.children
        .filter((child) => child.id !== nodeId)
        .map((child) => removeNodeById(child as EstimationBuilderNode, nodeId)),
    };
  }

  if (node.kind === "choice") {
    return {
      ...node,
      cases: node.cases
        .filter((formCase) => formCase.id !== nodeId)
        .map(
          (formCase) =>
            removeNodeById(
              formCase as EstimationBuilderNode,
              nodeId,
            ) as EstimationBuilderFormNode,
        ),
    };
  }

  return node;
};

export const addNodeToForm = (
  root: EstimationBuilderFormGraph,
  formId: EstimationNodeId,
  nodeToAdd: EstimationBuilderNode,
  index?: number,
): EstimationBuilderFormGraph =>
  updateNodeById(root, formId, (target) => {
    if (target.kind !== "form") return target;

    if (index === undefined || index < 0 || index >= target.children.length) {
      return {
        ...target,
        children: [...target.children, nodeToAdd],
      };
    }

    const next = [...target.children];
    next.splice(index, 0, nodeToAdd);
    return {
      ...target,
      children: next,
    };
  }) as EstimationBuilderFormGraph;

export const addCaseToChoice = (
  root: EstimationBuilderFormGraph,
  choiceId: EstimationNodeId,
): EstimationBuilderFormGraph =>
  updateNodeById(root, choiceId, (target) => {
    if (target.kind !== "choice") return target;
    const nextIndex = target.cases.length + 1;
    return {
      ...target,
      cases: [...target.cases, createFormNode(`Option ${nextIndex}`)],
    };
  }) as EstimationBuilderFormGraph;

export const removeCaseFromChoice = (
  root: EstimationBuilderFormGraph,
  choiceId: EstimationNodeId,
  caseFormId: EstimationNodeId,
): EstimationBuilderFormGraph =>
  updateNodeById(root, choiceId, (target) => {
    if (target.kind !== "choice") return target;
    return {
      ...target,
      cases: target.cases.filter((c) => c.id !== caseFormId),
    };
  }) as EstimationBuilderFormGraph;

export const findParentFormIdForChild = (
  root: EstimationBuilderFormGraph,
  childId: string,
): string | null => {
  let found: string | null = null;

  const walk = (node: EstimationBuilderNode) => {
    if (found) return;

    if (node.kind === "form") {
      if (node.children.some((child) => child.id === childId)) {
        found = node.id;
        return;
      }
      node.children.forEach((child) => walk(child as EstimationBuilderNode));
      return;
    }

    if (node.kind === "choice") {
      node.cases.forEach((formCase) => walk(formCase as EstimationBuilderNode));
    }
  };

  walk(root);
  return found;
};

export const getFormById = (
  root: EstimationBuilderFormGraph,
  formId: string,
): EstimationBuilderFormNode | null => {
  const found = findNodeById(root, formId);
  return found && found.kind === "form" ? found : null;
};

export const getFormChildren = (
  root: EstimationBuilderFormGraph,
  formId: string,
): EstimationBuilderNode[] => getFormById(root, formId)?.children ?? [];

export const isNodeWithinSubtree = (
  root: EstimationBuilderFormGraph,
  ancestorNodeId: string,
  targetNodeId: string,
): boolean => {
  const ancestor = findNodeById(root, ancestorNodeId);
  if (!ancestor) return false;
  if (ancestorNodeId === targetNodeId) return true;

  let exists = false;
  const walk = (node: EstimationBuilderNode) => {
    if (exists) return;
    if (node.id === targetNodeId) {
      exists = true;
      return;
    }

    if (node.kind === "form") {
      node.children.forEach((child) => walk(child as EstimationBuilderNode));
    }

    if (node.kind === "choice") {
      node.cases.forEach((formCase) => walk(formCase as EstimationBuilderNode));
    }
  };

  walk(ancestor as EstimationBuilderNode);
  return exists;
};

export const moveNodeBetweenForms = (
  root: EstimationBuilderFormGraph,
  nodeId: string,
  fromFormId: string,
  toFormId: string,
  toIndex?: number,
): EstimationBuilderFormGraph => {
  const node = findNodeById(root, nodeId);
  if (!node || node.id === root.id) return root;

  if (node.kind === "form" && isNodeWithinSubtree(root, node.id, toFormId)) {
    return root;
  }

  // Prevent a choice from being moved into any of its own case-descendant forms.
  if (node.kind === "choice" && isNodeWithinSubtree(root, node.id, toFormId)) {
    return root;
  }

  const sourceChildren = getFormChildren(root, fromFormId);
  if (!sourceChildren.some((child) => child.id === nodeId)) return root;

  let next = updateNodeById(root, fromFormId, (target) => {
    if (target.kind !== "form") return target;
    return {
      ...target,
      children: target.children.filter((child) => child.id !== nodeId),
    };
  }) as EstimationBuilderFormGraph;

  next = addNodeToForm(next, toFormId, node as EstimationBuilderNode, toIndex);

  return next;
};

export const validateEstimationFormGraph = (
  root: EstimationBuilderFormGraph,
): EstimationValidationResult => {
  const errors: EstimationValidationResult["errors"] = [];
  const seen = new Set<string>();

  const walk = (node: EstimationBuilderNode, path: string[]) => {
    if (seen.has(node.id)) {
      errors.push({
        code: "duplicate_node_id",
        node_id: node.id,
        path,
        message: `Duplicate node id: ${node.id}`,
      });
      return;
    }

    seen.add(node.id);

    if (node.kind === "form") {
      if (node.children.length === 0) {
        errors.push({
          code: "empty_form",
          node_id: node.id,
          path,
          message: `Form \"${node.name}\" has no children`,
        });
      }
      node.children.forEach((child) =>
        walk(child as EstimationBuilderNode, [...path, child.id]),
      );
      return;
    }

    if (node.kind === "choice") {
      if (!node.cases.length) {
        errors.push({
          code: "choice_without_cases",
          node_id: node.id,
          path,
          message: `Choice \"${node.name}\" has no cases`,
        });
      }
      node.cases.forEach((formCase) =>
        walk(formCase as EstimationBuilderNode, [...path, formCase.id]),
      );
      return;
    }

    if (Number.isNaN(Number(node.value))) {
      errors.push({
        code: "invalid_choice_answer",
        node_id: node.id,
        path,
        message: `Const \"${node.name ?? node.id}\" has an invalid value`,
      });
    }
  };

  walk(root as EstimationBuilderNode, [root.id]);

  return {
    valid: errors.length === 0,
    errors,
  };
};
