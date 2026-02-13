// shared/types/models/media.ts
export type FileType = "image" | "video" | "file";

export type MediaUsage = "page" | "product" | "module" | "job";

export type Media = {
  id?: number;
  project_idx: number;
  media_id: string | null;
  folder_id: number | null;
  public_id: string | null;
  type: FileType;
  url: string;
  signedUrl?: string;
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
  version?: number;
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