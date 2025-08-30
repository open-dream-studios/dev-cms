// project/src/types/pages.ts
export type ProjectPage = {
  id: number;
  project_id: number;
  definition_id: number;
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
  identifier: string;
  name: string;
  parent_page_definition_id: number | null;
  allowed_sections: string[];
  config_schema: Record<string, any>;
};