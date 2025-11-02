// shared/types/models/theme.ts
export type Theme = {
  id: number;
  project_id: number;
  name: string;
  config: Record<string, any>; 
  created_at: string;
  updated_at: string;
};