// project/src/types/project.ts
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

export const validUserRoles = ["owner", "editor", "viewer", "admin"] as const;
export type UserRole = typeof validUserRoles[number];

export type ProjectUser = {
  id?: number;
  project_idx: number;
  email: string;
  role: UserRole;
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
