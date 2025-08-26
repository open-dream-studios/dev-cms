// project/src/hooks/useModulesForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModuleSchema, ModuleFormData } from "@/util/schemas/moduleSchema";

export function useModulesForm(defaultValues?: Partial<ModuleFormData>) {
  return useForm<ModuleFormData>({
    resolver: zodResolver(ModuleSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      identifier: defaultValues?.identifier || "",
    },
  });
}