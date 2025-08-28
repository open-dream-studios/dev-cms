// project/src/types/pages.ts
export type Page = {
  id: number;
  project_id: number;
  parent_page_id?: number | null;
  title: string;
  slug: string;
  order_index: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[];
  template: string;
  published: boolean;
  published_at?: string | null;
  updated_at: string;
  created_at: string;
};

export type PageDefinition = {
  id: number;
  type: string; // e.g. "homepage", "blog_post"
  name: string; // human-readable
  allowed_sections: string[];
  config_schema: Record<string, any>;
};