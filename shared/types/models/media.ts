// shared/types/models/media.ts
export type FileType = "image" | "video" | "file";

export type MediaFolder = {
  id?: number;
  folder_id: string | null;
  project_idx: number;
  parent_folder_id: number | null;
  name: string;
  ordinal: number | null;
  created_at?: string;
  updated_at?: string;
};

export type UpsertMediaFolder = Omit<MediaFolder, "id">;

export type MediaUsage = "page" | "product" | "module";

export type Media = {
  id?: number;
  project_idx: number;
  media_id: string | null;
  folder_id: number | null;
  public_id: string | null;
  type: FileType;
  url: string;
  alt_text?: string | null;
  metadata?: Record<string, any> | null;
  width: number | null;
  height: number | null;
  size: number | null;
  tags: string[] | null;
  ordinal: number | null;
  originalName: string | null;
  s3Key: string | null;
  bucket: string | null;
  extension: string | null;
  mimeType: string | null;
  transformed: boolean;
  created_at?: string;
  updated_at?: string;
};

// export type UpsertMedia = Omit<Media, "id">

export type MediaLink = {
  id?: number;
  url: string;
  entity_type: MediaUsage;
  entity_id: number | null;
  media_id: number;
  ordinal: number | null;
};