// project/src/types/pages.ts
export type PageDefinition = {
  id?: number;
  page_definition_id: string;
  name: string;
  identifier: string;
  parent_page_definition_id: number | null;
  allowed_sections: string[];
  config_schema: Record<string, any>;
};

export type ProjectPage = {
  id?: number;
  page_id: string | null;
  project_idx: number;
  definition_id: number | null;
  parent_page_id: number | null;
  title: string | null;
  slug: string | null;
  ordinal: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  template: string | null;
  published: boolean | null;
  published_at?: string | null;
  updated_at?: string;
  created_at?: string;
};

export type SectionDefinition = {
  id?: number;
  section_definition_id: string | null;
  name: string;
  identifier: string;
  parent_section_definition_id: number | null;
  allowed_elements: string[];
  config_schema: Record<string, any>;
};

export type Section = {
  id?: number;
  section_id: string | null;
  project_idx: number;
  parent_section_id: number | null;
  project_page_id: number | null;
  definition_id: number | null;
  name: string | null;
  config: Record<string, any>;
  ordinal: number | null;
  created_at?: string;
  updated_at?: string;
};
