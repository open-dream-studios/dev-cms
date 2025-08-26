import { z } from "zod";
import { validUserRoles } from "@/types/project";

export const ProjectUserSchema = (existingEmails: string[]) =>
  z.object({
    email: z
      .email({ message: "Invalid email address" })
      .refine((val) => !existingEmails.includes(val), {
        message: "This email is already assigned",
      }),
    role: z.enum(validUserRoles, { message: "Invalid role" }),
  });

export type ProjectUserFormData = z.infer<ReturnType<typeof ProjectUserSchema>>;
