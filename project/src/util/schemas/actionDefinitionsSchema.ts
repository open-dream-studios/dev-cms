// project/src/util/schemas/actionDefinitionsSchema.ts
import * as z from "zod";

export const ActionDefinitionSchema = z.object({
  type: z
    .string()
    .min(2, { message: "Action type must be at least 2 characters" }),
  identifier: z.string().min(2, { message: "Action identifier is required" }),
  description: z.string(),
});

export type ActionDefinitionFormData = z.infer<typeof ActionDefinitionSchema>;
