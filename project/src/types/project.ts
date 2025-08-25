// project/src/types/project.ts
export interface Project {
  id: number;
  project_id: number;
  name: string;
  domain?: string;
}

export interface AddProjectInput {
  name: string;
  domain?: string;
}

export const validUserRoles: UserRole[] = ["owner", "editor", "viewer","admin"];
export type UserRole = "editor" | "owner" | "viewer" | "admin"
export type ProjectUser = {
  project_id: number;
  email: string;
  role: UserRole;
  project_name: string;
};