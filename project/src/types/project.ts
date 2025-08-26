// project/src/types/project.ts
export interface Project {
  id: number;
  project_id: number;
  name: string;
  short_name: string;
  domain?: string;
  logo: string;
}

export interface AddProjectInput {
  name: string;
  domain?: string;
}

export const validUserRoles = ["owner", "editor", "viewer", "admin"] as const;
export type UserRole = (typeof validUserRoles)[number];

export type ProjectUser = {
  project_id: number;
  email: string;
  role: UserRole;
  project_name?: string;
};

export type Module = {
  id: number;
  name: string;
  description: string | null;
};

export type ProjectModule = {
  project_idx: number;
  module_id: number;
  name: string;
  description: string | null;
  settings: any;
};

export type Integration = {
  project_idx: number;
  module: string;
  config: Record<string, string>;
};
