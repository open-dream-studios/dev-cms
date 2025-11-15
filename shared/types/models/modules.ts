// shared/types/models/modules.ts
import {
  Integration,
  Project,
  ProjectModule,
} from "./project";
import { PoolConnection } from "mysql2/promise";

export type RunModuleContext = {
  projectModules: ProjectModule[];
  integrations: Integration[];
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