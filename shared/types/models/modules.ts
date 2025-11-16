// shared/types/models/modules.ts
import { Project } from "./project";
import { PoolConnection } from "mysql2/promise";

export type RunModuleContext = {
  currentProject: Project;
  body?: any;
};

export interface ModuleInput {
  run: (args: RunModuleContext) => Promise<any>;
}

export type ModuleFunctionInputs = {
  connection: PoolConnection;
  project_idx: number;
  identifier: string;
  module: any;
  body: any;
  decryptedKeys: ModuleDecryptedKeys;
};

export type ModuleDecryptedKeys = Record<string, string | null>;

export type ModuleDefinitionTree = {
  name: string;
  type: "file" | "folder";
  fullPath: string;
  keys?: string[];
  required_keys?: string[];
  children?: ModuleDefinitionTree[];
};
