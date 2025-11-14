// shared/types/models/modules.ts
import {
  Integration,
  ModuleDefinition,
  Project,
  ProjectModule,
} from "./project";
import { PoolConnection } from "mysql2/promise";

export type RunModuleContext = {
  moduleDefinitions: ModuleDefinition[];
  projectModules: ProjectModule[];
  integrations: Integration[];
  currentProject: Project;
  body?: any;
};

export interface ModuleInputs {
  identifier: string;
  label: string;
  description?: string;
  expectedSchema?: string[];
  run: (args: RunModuleContext) => Promise<any>;
}

export type ModuleFunctionInputs = {
  connection: PoolConnection;
  project_idx: number;
  identifier: string;
  module: any;
  body: any;
  decryptedKeys: Record<string, string | null>
};
