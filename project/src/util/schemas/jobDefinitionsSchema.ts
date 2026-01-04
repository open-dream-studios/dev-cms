// project/src/util/schemas/jobDefinitionsSchema.ts
import * as z from "zod";

export const JobDefinitionSchema = z.object({
  type: z
    .string()
    .min(2, { message: "Job type must be at least 2 characters" }),
  identifier: z.string().min(2, { message: "Job identifier is required" }),
  description: z.string(),
});

export type JobDefinitionFormData = z.infer<typeof JobDefinitionSchema>;
