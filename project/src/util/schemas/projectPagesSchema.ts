// project/src/util/schemas/pageSchema.ts
import * as z from "zod";

export const ProjectPagesSchema = z.object({
  definition_id: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  title: z.string().min(1, { message: "" }),
  slug: z
    .string()
    .min(1, { message: "" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain letters, numbers, and dashes",
    })
    .transform((val) => val.toLowerCase()),
  order_index: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.array(z.string()).optional(),
  template: z.string().optional(),
  published: z.boolean().optional(),
  parent_page_id: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
});

export type ProjectPagesFormData = z.infer<typeof ProjectPagesSchema>;
