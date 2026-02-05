// project/src/modules/_helpers/folder.helpers.ts
import {
  EstimationFactDefinition,
  FolderScope,
  ProjectFolder,
} from "@open-dream/shared";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";

export type ProjectFolderNode = ProjectFolder & {
  children: ProjectFolderNode[];
  items: ProjectFolderNodeItem[];
};

export type ProjectFolderNodeItem =
  | EstimationFactDefinition
  | EstimationProcess;

export function buildFolderTree(
  folders: ProjectFolder[],
  items: ProjectFolderNodeItem[],
  scope: FolderScope
): ProjectFolderNode[] {
  const map = new Map<number, ProjectFolderNode>();

  const ROOT_ID = -1;

  map.set(ROOT_ID, {
    id: ROOT_ID,
    folder_id: "__root__",
    scope,
    name: "ROOT",
    parent_folder_id: null,
    process_id: null,
    ordinal: 0,
    project_idx: 0,
    created_at: "",
    updated_at: "",
    children: [],
    items: [],
  });

  // create folder nodes
  folders.forEach((f) => {
    map.set(f.id, {
      ...f,
      children: [],
      items: [],
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

  // attach items to folders
  items.forEach((item) => {
    const parentId = item.folder_id !== null ? item.folder_id : ROOT_ID;
    map.get(parentId)?.items.push(item);
  });

  map.forEach((node) => {
    // folders by ordinal
    node.children.sort((a, b) => a.ordinal - b.ordinal);

    // facts (nodes) alphabetically by key
    // if (node.scope === "estimation_fact_definition") {
    //   node.items.sort((a: EstimationFactDefinition, b: EstimationFactDefinition) =>
    //     a.fact_key.localeCompare(b.fact_key, undefined, {
    //       sensitivity: "base",
    //     })
    //   );
    // }
  });

  const root = map.get(ROOT_ID)!;

  return root.children.length || root.items.length ? [root] : [];
}
