// project/src/hooks/useProjectSettingsForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectSettingsFormData,
  ProjectSettingsSchema,
} from "@/util/schemas/projectSettingsSchema";

export function useProjectSettingsForm(defaultValues?: Partial<ProjectSettingsFormData>) {
  return useForm<ProjectSettingsFormData>({
    resolver: zodResolver(ProjectSettingsSchema),
    defaultValues: {
      name: "",
      short_name: "",
      domain: "",
      backend_domain: "",
      brand: "",
      ...defaultValues,
    },
  });
}