// project/src/types/project.ts
export interface Project {
  id: number;
  name: string;
  domain?: string;
}

export interface AddProjectInput {
  name: string;
  domain?: string;
}