// project/src/util/schemas/ProjectSettingsSchema.ts
import { z } from "zod";

export const ProjectSettingsSchema = z.object({
  name: z.string(),
  short_name: z.string(),
  domain: z.string(),
  backend_domain: z.string(),
  brand: z.string(),
});

export type ProjectSettingsFormData = z.infer<typeof ProjectSettingsSchema>;