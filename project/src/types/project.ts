// project/src/types/project.ts
export interface Project {
  id: number;
  project_id: string;
  name: string;
  short_name: string;
  domain?: string;
  backend_domain?: string;
  brand?: string;
  logo: string;
}

export interface AddProjectInput {
  name: string;
  domain?: string;
}

export const validUserRoles = ["owner", "editor", "viewer", "admin"] as const;
export type UserRole = (typeof validUserRoles)[number];

export type ProjectUser = {
  project_idx: number;
  email: string;
  role: UserRole;
  project_name?: string;
};

export type Module = {
  id: number;
  name: string;
  identifier: string;
  description: string | null;
  config_schema?: string[];
  parent_module_id: number | null;
};

export type ProjectModule = {
  id: number;
  project_idx: number;
  module_id: number;
  name: string;
  description: string | null;
  identifier: string;
  settings: any;
  parent_module_id: number | null
};

export type Integration = {
  project_idx: number;
  module_id: number;
  config: Record<string, string>;
};
