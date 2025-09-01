// project/src/util/schemas/sectionSchema.ts
import * as z from "zod";

export const ProjectSectionsSchema = z.object({
  definition_id: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  name: z.string().min(1, { message: "Section name is required" }),
  config: z
    .preprocess((val) => {
      if (typeof val === "string" && val.trim() === "") return {};
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      }
      return val ?? {};
    }, z.record(z.string(), z.any()).optional())
    .default({}),
  order_index: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  parent_section_id: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  project_page_id: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
});

export type ProjectSectionsFormData = z.infer<typeof ProjectSectionsSchema>;
