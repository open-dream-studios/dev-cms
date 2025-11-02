// project/src/util/schemas/sectionSchema.ts
import * as z from "zod";
import { Section } from "@open-dream/shared";

export const SectionSchema = z.object({
  parent_section_id: z.number().nullable().optional(),
  project_page_id: z.number().nullable().optional(),
  // definition_id: z.number().nullable().optional(),
  definition_id: z.preprocess(
    (val) => (val === "" || val == null ? null : Number(val)),
    z.number().nullable().optional()
  ),
  name: z.string().nullable().optional(),
  config: z.record(z.string(), z.any()),
  ordinal: z.number().nullable().optional(),
});

export type SectionFormData = z.infer<typeof SectionSchema>;

export function sectionToForm(section?: Section | null): SectionFormData {
  return {
    parent_section_id: section?.parent_section_id ?? null,
    project_page_id: section?.project_page_id ?? null,
    definition_id: section?.definition_id ?? null,
    name: section?.name ?? "",
    config: section?.config ?? {},
    ordinal: section?.ordinal ?? null,
  };
}
