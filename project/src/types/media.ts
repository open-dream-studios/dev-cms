// project/src/types/media.ts
export type FileType = "image" | "video" | "file";

export type MediaFolder = {
  id: number;
  project_idx: number;
  parent_id: number | null;
  name: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  ordinal: number;
};

export type MediaUsage = "page" | "product" | "module" | "general";

export type Media = {
  id: number;
  project_idx: number;
  folder_id: number | null;
  public_id: number | null;
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