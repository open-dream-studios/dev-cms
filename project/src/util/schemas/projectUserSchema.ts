import { accessLevels } from "@open-dream/shared";
import { z } from "zod";

const accessLevelKeys = Object.keys(accessLevels) as [
  keyof typeof accessLevels,
  ...(keyof typeof accessLevels)[]
];


export const ProjectUserSchema = (existingEmails: string[]) =>
  z.object({
    email: z
      .string({ message: "Invalid email address" })
      .refine((val) => !existingEmails.includes(val), {
        message: "This email is already assigned",
      }),
    role: z.enum(accessLevelKeys, { message: "Invalid role" }),
  });

export type ProjectUserFormData = z.infer<ReturnType<typeof ProjectUserSchema>>;
