// project/src/types/media.ts
export type FileType = "image" | "video" | "file";

export type MediaFolder = {
  id: number;
  project_idx: number;
  parent_id: number | null;
  name: string;
  created_at: string; 
  updated_at: string;  
  ordinal: number;
};

export type MediaUsage = "page" | "product" | "module";

export type Media = {
  id: number;
  project_idx: number;
  folder_id: number | null;
  public_id: string | null;
  type: FileType;
  url: string;
  alt_text?: string | null;
  metadata?: Record<string, any> | null;
  media_usage: MediaUsage;
  tags: string[];
  ordinal: number;
  created_at: string;
  updated_at: string;
};

export type MediaInsert = {
  project_idx: number;
  public_id: string | null;
  url: string;
  type: FileType;
  folder_id: number | null;
  media_usage: MediaUsage;
};

export type MediaLink = {
  id?: number; 
  url: string;
  entity_type: MediaUsage,
  entity_id: number | null; 
  media_id: number; 
  ordinal: number;
  created_at?: string;  
};

export type TempMediaLink = MediaLink & { isTemp?: boolean };