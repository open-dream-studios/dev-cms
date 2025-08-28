// project/src/util/schemas/ProjectSettingsSchema.ts
import { z } from "zod";

const optionalString = z
  .string()
  .nullable()
  .transform((val) => (val === "" ? undefined : val))
  .optional();

export const ProjectSettingsSchema = z.object({
  name: z.string().min(1, { message: "Name requires at least 1 char" }),
  short_name: optionalString,
  domain: optionalString,
  backend_domain: optionalString,
  brand: optionalString,
  logo: optionalString,
});

export type ProjectSettingsFormData = z.infer<typeof ProjectSettingsSchema>;
