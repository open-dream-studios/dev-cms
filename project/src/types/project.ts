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
  parent_module_id: number | null;
};

export type Integration = {
  project_idx: number;
  module_id: number;
  config: Record<string, string>;
};
