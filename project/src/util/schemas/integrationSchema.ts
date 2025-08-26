// project/src/util/schemas/integrationSchema.ts
import { z } from "zod";

export const IntegrationSchema = z.object({
  key: z.string().min(1, { message: "Key is required" }),
  value: z.string().min(1, { message: "Value is required" }),
});

export type IntegrationFormData = z.infer<typeof IntegrationSchema>;