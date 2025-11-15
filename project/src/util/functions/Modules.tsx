// src/util/functions/Modules.tsx
import { ModuleDefinitionTree } from "@open-dream/shared";
import { capitalizeFirstLetter } from "./Data";

export const cleanModuleIdentifier = (identifier: string) => {
  return identifier.split("-").map(capitalizeFirstLetter).join(" ");
};

export const nodeHasChildren = (node: ModuleDefinitionTree) => {
  if (
    node.children &&
    node.children.filter(
      (m: ModuleDefinitionTree) => !/^m\.(ts|js)$/.test(m.name)
    ).length
  ) {
    return true;
  }
  return false;
};

export async function getModulesStructureKeys(tree: ModuleDefinitionTree): Promise<string[]> {
  const keySet = new Set<string>();
  function walk(node: ModuleDefinitionTree) {
    if (node.type === "file" && Array.isArray(node.keys)) {
      for (const key of node.keys) {
        keySet.add(key);
      }
    }
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }
  walk(tree);
  return Array.from(keySet);
}
