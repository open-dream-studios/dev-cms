import { accessLevels } from "@open-dream/shared";
import { z } from "zod";

export const ProjectUserSchema = (existingEmails: string[]) =>
  z.object({
    email: z
      .email({ message: "Invalid email address" })
      .refine((val) => !existingEmails.includes(val), {
        message: "This email is already assigned",
      }),
    role: z.enum(Object.keys(accessLevels), { message: "Invalid role" }),
  });

export type ProjectUserFormData = z.infer<ReturnType<typeof ProjectUserSchema>>;
