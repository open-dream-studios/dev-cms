// project/src/types/media.ts
export type FileType = "image" | "video" | "file";

export type MediaFolder = {
  id: number;
  folder_id: string | null;
  project_idx: number;
  parent_folder_id: number | null;
  name: string;
  ordinal: number;
  created_at?: string; 
  updated_at?: string;  
};

export type UpsertMediaFolder = Omit<MediaFolder, "id">

export type MediaUsage = "page" | "product" | "module";

export type Media = {
  id: number;
  project_idx: number;
  media_id: string | null;
  folder_id: number | null;
  public_id: string | null;
  type: FileType;
  url: string;
  alt_text?: string | null;
  metadata?: Record<string, any> | null;
  media_usage: MediaUsage;
  tags: string[] | null;
  ordinal: number;
  created_at?: string;
  updated_at?: string;
};

export type UpsertMedia = Omit<Media, "id">

export type MediaLink = {
  id: number; 
  url: string;
  entity_type: MediaUsage,
  entity_id: number; 
  media_id: number; 
  ordinal: number;
};

export type UpsertMediaLink = Omit<MediaLink, "id" | "url">
