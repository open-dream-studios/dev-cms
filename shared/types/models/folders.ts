// shared/types/models/folders.ts
export type FolderScope =
  | "estimation_fact_definition"
  | "estimation_variable"
  | "estimation_process"
  | "media";
export const folderScopes: FolderScope[] = [
  "estimation_fact_definition",
  "estimation_variable",
  "estimation_process",
  "media",
];

export type ProjectFolder = {
  id: number;
  folder_id: string;
  project_idx: number;
  process_id: number | null;
  scope: FolderScope;
  parent_folder_id: number | null;
  name: string;
  ordinal: number;
  created_at: string;
  updated_at: string;
};

export interface FolderInput {
  folder_id: string | null;
  project_idx?: number;
  process_id?: number | null;
  scope: FolderScope;
  parent_folder_id?: number | null;
  name: string;
  ordinal?: number | null;
}
