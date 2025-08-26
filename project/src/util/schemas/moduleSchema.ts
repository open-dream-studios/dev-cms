import * as z from "zod";

export const ModuleSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Module name must be at least 2 characters" }),
  description: z.string().optional(),
  identifier: z.string().min(2, { message: "Identifier is required" }),
});

export type ModuleFormData = z.infer<typeof ModuleSchema>;
