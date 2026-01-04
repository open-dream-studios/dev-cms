// project/src/hooks/useActionDefinitionsForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionDefinitionFormData, ActionDefinitionSchema } from "@/util/schemas/actionDefinitionsSchema";

export function useActionDefinitionsForm(defaultValues?: Partial<ActionDefinitionFormData>) {
  return useForm<ActionDefinitionFormData>({
    resolver: zodResolver(ActionDefinitionSchema),
    defaultValues: {
      type: defaultValues?.type || "",
      identifier: defaultValues?.identifier || "",
      description: defaultValues?.description || "", 
    },
  });
}