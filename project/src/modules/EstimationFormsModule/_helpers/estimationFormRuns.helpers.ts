// project/src/modules/EstimationFormsModule/_helpers/estimationFormRuns.helpers.ts
import type {
  EstimationChoiceNode,
  EstimationFormDefinition,
  EstimationFormGraph,
  EstimationFormNode,
  EstimationNode,
} from "@open-dream/shared";

export type EstimationFormRunChoiceStep = {
  choiceNode: EstimationChoiceNode;
  parentFormId: string;
  depth: number;
  pathLabel: string;
};

export type EstimationFormRunSectionTotal = {
  form_id: string;
  label: string;
  depth: number;
  subtotal: number;
  direct_const_total: number;
  selected_choice_total: number;
  child_form_total: number;
  line_items: { id: string; label: string; value: number }[];
};

export type EstimationFormRunResult = {
  base_total: number;
  final_total: number;
  percent_adjustment: number;
  flat_adjustment: number;
  sections: EstimationFormRunSectionTotal[];
};

export type EstimationFormRunValidation = {
  valid: boolean;
  errors: string[];
};

const isFormNode = (node: EstimationNode): node is EstimationFormNode =>
  node.kind === "form";

const getNodeLabel = (node: EstimationNode): string => {
  if (node.kind === "const") return node.name?.trim() || "Line Item";
  return node.name?.trim() || (node.kind === "choice" ? "Choose" : "Section");
};

export const validateRunnableFormGraph = (
  root: EstimationFormGraph
): EstimationFormRunValidation => {
  const errors: string[] = [];
  const seen = new Set<string>();
  let constCount = 0;

  const walk = (node: EstimationNode, stack: string[]) => {
    if (seen.has(node.id)) {
      errors.push(`Duplicate node id at ${stack.join(" > ") || "root"}`);
      return;
    }
    seen.add(node.id);

    if (node.kind === "const") {
      constCount += 1;
      return;
    }

    if (node.kind === "choice") {
      if (!node.cases?.length) {
        errors.push(`Choice \"${getNodeLabel(node)}\" has no options`);
      }
      for (const option of node.cases) {
        if (!isFormNode(option)) {
          errors.push(`Choice \"${getNodeLabel(node)}\" contains invalid option`);
          continue;
        }
        walk(option, [...stack, getNodeLabel(node), getNodeLabel(option)]);
      }
      return;
    }

    if (!node.children?.length) {
      errors.push(`Form \"${getNodeLabel(node)}\" is empty`);
    }

    for (const child of node.children) {
      if (child.kind !== "form" && child.kind !== "choice" && child.kind !== "const") {
        errors.push(`Unsupported node in \"${getNodeLabel(node)}\"`);
        continue;
      }
      walk(child, [...stack, getNodeLabel(node)]);
    }
  };

  walk(root, []);

  if (constCount === 0) {
    errors.push("No cost items found");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const findFormNodeById = (
  root: EstimationFormGraph,
  formId: string
): EstimationFormNode | null => {
  if (root.id === formId) return root;

  const walk = (node: EstimationNode): EstimationFormNode | null => {
    if (node.kind === "form") {
      if (node.id === formId) return node;
      for (const child of node.children) {
        const found = walk(child);
        if (found) return found;
      }
    }

    if (node.kind === "choice") {
      for (const option of node.cases) {
        const found = walk(option);
        if (found) return found;
      }
    }

    return null;
  };

  return walk(root);
};

export const findParentFormId = (
  root: EstimationFormGraph,
  formId: string
): string | null => {
  if (root.id === formId) return null;

  let parentId: string | null = null;

  const walk = (node: EstimationNode, currentFormId: string | null) => {
    if (parentId) return;

    if (node.kind === "form") {
      if (node.id === formId) {
        parentId = currentFormId;
        return;
      }
      for (const child of node.children) {
        walk(child, node.id);
      }
      return;
    }

    if (node.kind === "choice") {
      for (const option of node.cases) {
        walk(option, currentFormId);
      }
    }
  };

  walk(root, null);
  return parentId;
};

export const getReachableChoiceIds = (
  form: EstimationFormGraph,
  selectedCaseByChoiceId: Record<string, string>
): Set<string> => {
  const ids = new Set<string>();

  const walkForm = (formNode: EstimationFormNode) => {
    for (const child of formNode.children) {
      if (child.kind === "choice") {
        ids.add(child.id);
        const selectedCaseId = selectedCaseByChoiceId[child.id];
        const selectedCase = child.cases.find((c) => c.id === selectedCaseId);
        if (selectedCase) walkForm(selectedCase);
      } else if (child.kind === "form") {
        walkForm(child);
      }
    }
  };

  walkForm(form);
  return ids;
};

export const pruneAnswersToReachableChoices = (
  form: EstimationFormGraph,
  selectedCaseByChoiceId: Record<string, string>
): Record<string, string> => {
  const reachable = getReachableChoiceIds(form, selectedCaseByChoiceId);
  const next: Record<string, string> = {};

  for (const [choiceId, caseId] of Object.entries(selectedCaseByChoiceId)) {
    if (reachable.has(choiceId)) {
      next[choiceId] = caseId;
    }
  }

  return next;
};

export const getChoiceStepsDepthFirst = (
  form: EstimationFormGraph,
  selectedCaseByChoiceId: Record<string, string>
): EstimationFormRunChoiceStep[] => {
  const steps: EstimationFormRunChoiceStep[] = [];

  const walkForm = (formNode: EstimationFormNode, depth: number, parentPath: string[]) => {
    for (const child of formNode.children) {
      if (child.kind === "choice") {
        const pathLabel = [...parentPath, formNode.name, child.name].filter(Boolean).join(" / ");
        steps.push({
          choiceNode: child,
          parentFormId: formNode.id,
          depth,
          pathLabel,
        });

        const selectedCaseId = selectedCaseByChoiceId[child.id];
        const selectedCase = child.cases.find((c) => c.id === selectedCaseId);
        if (selectedCase) {
          walkForm(selectedCase, depth + 1, [...parentPath, formNode.name, child.name]);
        }
      }

      if (child.kind === "form") {
        walkForm(child, depth + 1, [...parentPath, formNode.name]);
      }
    }
  };

  walkForm(form, 0, []);
  return steps;
};

export const isRunComplete = (
  form: EstimationFormGraph,
  selectedCaseByChoiceId: Record<string, string>
): boolean => {
  const steps = getChoiceStepsDepthFirst(form, selectedCaseByChoiceId);
  for (const step of steps) {
    const selectedCaseId = selectedCaseByChoiceId[step.choiceNode.id];
    if (!selectedCaseId) return false;
    if (!step.choiceNode.cases.some((option) => option.id === selectedCaseId)) return false;
  }
  return true;
};

export const getFormSubtreeCompletion = (
  formNode: EstimationFormNode,
  selectedCaseByChoiceId: Record<string, string>
): { complete: boolean; totalChoices: number; answeredChoices: number } => {
  let totalChoices = 0;
  let answeredChoices = 0;

  const walkForm = (node: EstimationFormNode) => {
    for (const child of node.children) {
      if (child.kind === "choice") {
        totalChoices += 1;
        const selectedCaseId = selectedCaseByChoiceId[child.id];
        const selectedCase = child.cases.find((option) => option.id === selectedCaseId);

        if (selectedCase) {
          answeredChoices += 1;
          walkForm(selectedCase);
        }
      }

      if (child.kind === "form") {
        walkForm(child);
      }
    }
  };

  walkForm(formNode);

  return {
    complete: totalChoices > 0 ? answeredChoices === totalChoices : true,
    totalChoices,
    answeredChoices,
  };
};

const calculateFormSection = (
  formNode: EstimationFormNode,
  selectedCaseByChoiceId: Record<string, string>,
  depth: number,
  sections: EstimationFormRunSectionTotal[]
): number => {
  let directConstTotal = 0;
  let selectedChoiceTotal = 0;
  let childFormTotal = 0;
  const lineItems: { id: string; label: string; value: number }[] = [];

  for (const child of formNode.children) {
    if (child.kind === "const") {
      directConstTotal += child.value;
      lineItems.push({
        id: child.id,
        label: child.name?.trim() || "Line Item",
        value: child.value,
      });
      continue;
    }

    if (child.kind === "form") {
      childFormTotal += calculateFormSection(child, selectedCaseByChoiceId, depth + 1, sections);
      continue;
    }

    const selectedCaseId = selectedCaseByChoiceId[child.id];
    const selectedCase = child.cases.find((option) => option.id === selectedCaseId);
    if (selectedCase) {
      selectedChoiceTotal += calculateFormSection(
        selectedCase,
        selectedCaseByChoiceId,
        depth + 1,
        sections
      );
    }
  }

  const subtotal = directConstTotal + selectedChoiceTotal + childFormTotal;
  sections.push({
    form_id: formNode.id,
    label: formNode.name || "Section",
    depth,
    subtotal,
    direct_const_total: directConstTotal,
    selected_choice_total: selectedChoiceTotal,
    child_form_total: childFormTotal,
    line_items: lineItems,
  });

  return subtotal;
};

export const calculateRunResult = (
  form: EstimationFormGraph,
  selectedCaseByChoiceId: Record<string, string>,
  percentAdjustment: number,
  flatAdjustment: number
): EstimationFormRunResult => {
  const sections: EstimationFormRunSectionTotal[] = [];
  const baseTotal = calculateFormSection(form, selectedCaseByChoiceId, 0, sections);
  const finalTotal = Math.max(
    0,
    baseTotal + flatAdjustment + (baseTotal * percentAdjustment) / 100
  );

  return {
    base_total: baseTotal,
    final_total: finalTotal,
    percent_adjustment: percentAdjustment,
    flat_adjustment: flatAdjustment,
    sections,
  };
};

export const getRunnableForms = (
  forms: EstimationFormDefinition[]
): (EstimationFormDefinition & { description?: string })[] =>
  forms.filter((form) => {
    if (form.status !== "published") return false;
    return validateRunnableFormGraph(form.root).valid;
  });

export const formatMoney = (value: number) =>
  `$${Math.round(value).toLocaleString("en-US")}`;
