// project/src/util/schemas/ProjectSettingsSchema.ts
import { z } from "zod";

const optionalString = z
  .string()
  .transform((val) => (val === "" ? undefined : val))
  .nullable()
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

export function projectSettingsToForm(
  projectSettings?: any | null
): ProjectSettingsFormData {
  return {
    name: projectSettings?.name ?? "",
    short_name: projectSettings?.short_name ?? null,
    domain: projectSettings?.domain ?? null,
    backend_domain: projectSettings?.backend_domain ?? null,
    brand: projectSettings?.brand ?? null,
    logo: projectSettings?.logo ?? null,
  };
}
