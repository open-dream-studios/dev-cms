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
} as const;

export const projectRoles = {
  admin: 9,
  owner: 8,
  manager: 5,
  editor: 3,
  viewer: 1,
} as const;

export type ProjectUser = {
  id?: number;
  project_idx: number;
  email: string;
  clearance: number;
  invited_at?: string;
};

export type ProjectModule = {
  id?: number;
  module_id: string | null;
  module_identifier: string;
  project_idx: number;
  settings: any;
  required_access: number;
  frontend_visible: boolean;
};

export type Integration = {
  id?: number;
  integration_id: string | null;
  project_idx: number;
  integration_key: string;
};

export type DecryptedIntegration = {
  id?: number;
  integration_id: string | null;
  project_idx: number;
  integration_key: string;
  integration_value: string | null;
};
