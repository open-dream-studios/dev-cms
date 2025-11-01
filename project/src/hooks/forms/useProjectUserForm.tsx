// project/src/hooks/useProjectUserForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectUserSchema,
  ProjectUserFormData,
} from "@/util/schemas/projectUserSchema";
import { getRoleFromClearance } from "@/util/functions/Users";

export function useProjectUserForm(existingEmails: string[]) {
  return useForm<ProjectUserFormData>({
    resolver: zodResolver(ProjectUserSchema(existingEmails)),
    defaultValues: {
      email: "",
      role: getRoleFromClearance(3),
    },
  });
}
