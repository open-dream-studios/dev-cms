// project/src/modules/EstimationsModule/_helpers/estimations.helpers.ts
import { FactType } from "@open-dream/shared";
import {
  EstimationFactFolder,
  EstimationFactDefinition,
} from "@open-dream/shared";

export const factTypeConversion = (factType: FactType) => {
  let fact: any = factType;
  if (factType === "enum") fact = "Selection";
  if (factType === "boolean") fact = "True / False";
  if (factType === "string") fact = "Text";
  return fact;
};

export type FactFolderNode = EstimationFactFolder & {
  children: FactFolderNode[];
  facts: EstimationFactDefinition[];
};

export function buildFactFolderTree(
  folders: EstimationFactFolder[],
  facts: EstimationFactDefinition[],
): FactFolderNode[] {
  const map = new Map<number, FactFolderNode>();

  const ROOT_ID = -1;

  map.set(ROOT_ID, {
    id: ROOT_ID,
    folder_id: "__root__",
    name: "ROOT",
    parent_folder_id: null,
    ordinal: 0,
    process_id: 1,
    project_idx: 0,
    created_at: "",
    updated_at: "",
    children: [],
    facts: [],
  });

  // create folder nodes
  folders.forEach((f) => {
    map.set(f.id, {
      ...f,
      children: [],
      facts: [],
    });
  });

  // attach folders to parents
  map.forEach((node) => {
    if (node.id === ROOT_ID) return;

    const parentId =
      node.parent_folder_id !== null && map.has(node.parent_folder_id)
        ? node.parent_folder_id
        : ROOT_ID;

    map.get(parentId)!.children.push(node);
  });

  // attach facts to folders
  facts.forEach((fact) => {
    const parentId = fact.folder_id !== null ? fact.folder_id : ROOT_ID;
    map.get(parentId)?.facts.push(fact);
  });

  map.forEach((node) => {
    // folders by ordinal
    node.children.sort((a, b) => a.ordinal - b.ordinal);

    // facts (nodes) alphabetically by key
    node.facts.sort((a, b) =>
      a.fact_key.localeCompare(b.fact_key, undefined, {
        sensitivity: "base",
      }),
    );
  });

  const root = map.get(ROOT_ID)!;

  return root.children.length || root.facts.length ? [root] : [];
}