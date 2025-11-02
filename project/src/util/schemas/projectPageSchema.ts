import * as z from "zod";
import { ProjectPage } from "@shared/types/models/pages";

export const ProjectPageSchema = z.object({
  parent_page_id: z.number().nullable().optional(),
  definition_id: z.number().nullable().optional(),
  title: z.string().min(1, { message: "" }),
  slug: z
    .string()
    .min(1, { message: "" })
    .regex(/^[a-z0-9-/]+$/, {
      message: "Slug can only contain letters, numbers, and dashes",
    })
    .transform((val) => {
      const normalized = val.toLowerCase();
      return normalized.startsWith("/") ? normalized : `/${normalized}`;
    }),
  ordinal: z.number().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  seo_keywords: z.array(z.string()).nullable().optional(),
  template: z.string().nullable().optional(),
  published: z.boolean().nullable().optional(),
});

export type ProjectPageFormData = z.infer<typeof ProjectPageSchema>;

export function pageToForm(page?: ProjectPage | null): ProjectPageFormData {
  return {
    parent_page_id: page?.parent_page_id ?? null,
    definition_id: page?.definition_id ?? null,
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    ordinal: page?.ordinal ?? null,
    seo_title: page?.seo_title ?? null,
    seo_description: page?.seo_description ?? null,
    seo_keywords: page?.seo_keywords ?? null,
    template: page?.template ?? null,
    published: page ? !!page.published : false,
  };
}
