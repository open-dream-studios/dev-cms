// project/src/modules/EstimationsModule/_helpers/estimations.helpers.ts
import { FactType } from "@open-dream/shared";
import { EstimationFactFolder, EstimationFactDefinition } from "@open-dream/shared";

export const factTypeConversion = (factType: FactType) => {
  let fact: any = factType;
  if (factType === "enum") fact = "Selectable";
  if (factType === "boolean") fact = "Yes / No";
  if (factType === "string") fact = "Text";
  return fact;
};

export type FactFolderNode = EstimationFactFolder & {
  children: FactFolderNode[];
  facts: EstimationFactDefinition[];
};

export function buildFactFolderTree(
  folders: EstimationFactFolder[],
  facts: EstimationFactDefinition[]
): FactFolderNode[] {
  const map = new Map<number, FactFolderNode>();

  // virtual root (numeric sentinel)
  const ROOT_ID = -1;

  map.set(ROOT_ID, {
    id: ROOT_ID,
    folder_id: "__root__",
    name: "ROOT",
    parent_folder_id: null,
    ordinal: 0,
    project_idx: 0,
    created_at: "",
    updated_at: "",
    children: [],
    facts: [],
  });

  // create folder nodes (KEYED BY id)
  folders.forEach((f) => {
    map.set(f.id, {
      ...f,
      children: [],
      facts: [],
    });
  });

  // attach folders
  map.forEach((node) => {
    if (node.id === ROOT_ID) return;

    const parentId =
      node.parent_folder_id !== null && map.has(node.parent_folder_id)
        ? node.parent_folder_id
        : ROOT_ID;

    map.get(parentId)!.children.push(node);
  });

  // attach facts
  facts.forEach((fact) => {
    const parentId =
      fact.folder_id !== null
        ? folders.find((f) => f.folder_id === fact.folder_id)?.id ?? ROOT_ID
        : ROOT_ID;

    map.get(parentId)!.facts.push(fact);
  });

  return map.get(ROOT_ID)!.children.length ||
    map.get(ROOT_ID)!.facts.length
    ? [map.get(ROOT_ID)!]
    : [];
}