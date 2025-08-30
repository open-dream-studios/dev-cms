// project/src/util/schemas/pageDefinitionsSchema.ts
import * as z from "zod";

export const PageDefinitionSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Page name must be at least 2 characters" }),
  identifier: z.string().min(2, { message: "Page type is required" }),
  allowed_sections: z.array(z.string()).optional(),
});

export type PageDefinitionFormData = z.infer<typeof PageDefinitionSchema>;