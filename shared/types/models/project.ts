// shared/types/models/project.ts
export type Project = {
  id?: number;
  project_id: string | null;
  name: string;
  short_name: string | null;
  domain: string | null;
  backend_domain: string | null;
  brand: string | null;
  logo: string | null;
};

export const accessLevels = {
  admin: 9,
  owner: 8,
  protected_access: 7,
  all_access: 6,
  manager: 5,
  specialist: 4,
  editor: 3,
  client: 2,
  viewer: 1,
  external: 0,
} as const

export const projectRoles = {
  admin: 9,
  owner: 8,
  manager: 5,
  editor: 3,
  viewer: 1,
} as const

export type ProjectUser = {
  id?: number;
  project_idx: number;
  email: string;
  clearance: number;
  invited_at?: string;
};

export type ModuleDefinition = {
  id?: number;
  module_definition_id: string | null;
  name: string;
  identifier: string;
  description: string | null;
  parent_module_id: number | null;
  config_schema: string[];
};

export type ProjectModule = {
  id?: number;
  module_id: string | null;
  module_definition_id: number;
  project_idx: number;
  settings: any;
  name?: string;
  description?: string | null;
  identifier?: string;
  parent_module_id?: number | null;
};

export type Integration = {
  id?: number;
  integration_id: string | null;
  project_idx: number;
  module_id: number;
  integration_key: string;
  integration_value: string | null;
};
