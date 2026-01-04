// project/src/util/schemas/pageDefinitionsSchema.ts
import * as z from "zod";

export const PageDefinitionSchema = z.object({
  type: z
    .string()
    .min(2, { message: "Page name must be at least 2 characters" }),
  description: z.string().nullable(),
  identifier: z.string().min(2, { message: "Page type is required" }),
  allowed_sections: z.array(z.string()).optional(),
});

export type PageDefinitionFormData = z.infer<typeof PageDefinitionSchema>;

// SECTIONS
export const SectionDefinitionSchema = z.object({
  type: z
    .string()
    .min(2, { message: "Section name must be at least 2 characters" }),
  description: z.string().nullable(),
  identifier: z.string().min(2, { message: "Section type is required" }),
  allowed_sections: z.array(z.string()).optional(),
});

export type SectionDefinitionFormData = z.infer<typeof SectionDefinitionSchema>;