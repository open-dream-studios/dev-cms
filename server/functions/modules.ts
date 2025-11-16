// server/functions/modules.ts
import { ModuleDefinitionTree } from "@open-dream/shared";
import fs from "fs";
import path from "path";

const moduleStructureDir = path.resolve(process.cwd(), "dist/module_structure");

function buildTree(dirPath: string): ModuleDefinitionTree {
  const stats = fs.statSync(dirPath);

  if (!stats.isDirectory()) {
    const base = path.basename(dirPath);
    if (base === "m.ts" || base === "m.js") {
      try {
        const fileContent = fs.readFileSync(dirPath, "utf8");
        const match = fileContent.match(
          /export\s+const\s+keys\s*=\s*(\{[\s\S]*?\})/
        );
        if (match) {
          const keysObj = eval("(" + match[1] + ")");
          if (keysObj && typeof keysObj === "object") {
            const allKeys = Object.keys(keysObj);
            const requiredKeys = allKeys.filter((k) => keysObj[k] === true);

            return {
              name: base,
              type: "file",
              fullPath: dirPath,
              keys: allKeys,
              required_keys: requiredKeys,
            };
          }
        }
      } catch (err) {
        console.error("Failed parsing keys in:", dirPath, err);
      }
    }
    return {
      name: base,
      type: "file",
      fullPath: dirPath,
    };
  }
  const children = fs.readdirSync(dirPath).map((item) => {
    const childPath = path.join(dirPath, item);
    return buildTree(childPath);
  });
  return {
    name: path.basename(dirPath),
    type: "folder",
    fullPath: dirPath,
    children,
  };
}

export function findNodeByName(
  node: ModuleDefinitionTree,
  name: string
): ModuleDefinitionTree | null {
  if (node.name === name) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }
  return null;
}

export async function loadModuleConfig(moduleFolder: ModuleDefinitionTree) {
  if (!moduleFolder.children) {
    return { run: null, keys: [], required_keys: [] };
  }
  const mFile = moduleFolder.children.find(
    (child) => child.type === "file" && /^m\.(ts|js)$/.test(child.name)
  );
  if (!mFile || !mFile.fullPath) {
    return { run: null, keys: [], required_keys: [] };
  }
  const moduleImport = await import(mFile.fullPath);
  return {
    run: moduleImport.run || null,
    keys: mFile.keys || [],
    required_keys: mFile.required_keys || [],
  };
}

export async function getModulesStructureKeys(
  tree: ModuleDefinitionTree
): Promise<string[]> {
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

export const getModulesStructure = async () => {
  const tree = buildTree(moduleStructureDir);
  // console.log(JSON.stringify(tree, null, 2));
  return tree as ModuleDefinitionTree;
};
