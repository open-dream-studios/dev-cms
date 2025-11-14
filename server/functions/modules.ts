// server/functions/modules.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type FileNode = {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  keys?: string[];
  required_keys?: string[];
  fullPath?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moduleStructureDir = path.join(
  path.dirname(__dirname),
  "module_structure"
);

function buildTree(dirPath: string): FileNode {
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

export function findNodeByName(node: FileNode, name: string): FileNode | null {
  if (node.name === name) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }
  return null;
}

export async function loadModuleConfig(moduleFolder: FileNode) {
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

export const getModulesStructure = async () => {
  const tree = buildTree(moduleStructureDir);
  // console.log(JSON.stringify(tree, null, 2));
  return tree;
};

// const folder = {
//   name: "module_structure",
//   type: "folder",
//   fullPath:
//     "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure",
//   children: [
//     {
//       name: "customers-module",
//       type: "folder",
//       fullPath:
//         "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/customers-module",
//       children: [
//         {
//           name: "customer-products-module",
//           type: "folder",
//           fullPath:
//             "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/customers-module/customer-products-module",
//           children: [
//             {
//               name: "customer-products-google-sheets-module",
//               type: "folder",
//               fullPath:
//                 "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/customers-module/customer-products-module/customer-products-google-sheets-module",
//               children: [
//                 {
//                   name: "m.js",
//                   type: "file",
//                   fullPath:
//                     "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/customers-module/customer-products-module/customer-products-google-sheets-module/m.js",
//                   keys: ["sheetId", "sheetName", "serviceAccountJson"],
//                   required_keys: ["sheetId", "sheetName", "serviceAccountJson"],
//                 },
//               ],
//             },
//             {
//               name: "customer-products-wix-sync-module",
//               type: "folder",
//               fullPath:
//                 "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/customers-module/customer-products-module/customer-products-wix-sync-module",
//               children: [
//                 {
//                   name: "m.js",
//                   type: "file",
//                   fullPath:
//                     "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/customers-module/customer-products-module/customer-products-wix-sync-module/m.js",
//                   keys: ["WIX_GENERATED_SECRET", "WIX_BACKEND_URL"],
//                   required_keys: ["WIX_GENERATED_SECRET", "WIX_BACKEND_URL"],
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//     {
//       name: "google-module",
//       type: "folder",
//       fullPath:
//         "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/google-module",
//       children: [
//         {
//           name: "google-maps-api-module",
//           type: "folder",
//           fullPath:
//             "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/google-module/google-maps-api-module",
//           children: [
//             {
//               name: "m.js",
//               type: "file",
//               fullPath:
//                 "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/google-module/google-maps-api-module/m.js",
//               keys: ["GOOGLE_API_KEY"],
//               required_keys: ["GOOGLE_API_KEY"],
//             },
//           ],
//         },
//         {
//           name: "m.js",
//           type: "file",
//           fullPath:
//             "/Users/josephgoff/Documents/FRIDAY/open_dream/dev-cms/server/dist/module_structure/google-module/m.js",
//         },
//       ],
//     },
//   ],
// };
