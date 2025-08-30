// project/src/hooks/usePageDefinitionsForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PageDefinitionSchema,
  PageDefinitionFormData,
} from "@/util/schemas/pageDefinitionsSchema";

export function usePageDefinitionsForm(defaultValues?: Partial<PageDefinitionFormData>) {
  return useForm<PageDefinitionFormData>({
    resolver: zodResolver(PageDefinitionSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      identifier: defaultValues?.identifier || "",
      allowed_sections: defaultValues?.allowed_sections || [],
    },
  });
}