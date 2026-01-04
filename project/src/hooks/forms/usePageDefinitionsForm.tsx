// project/src/hooks/usePageDefinitionsForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PageDefinitionSchema,
  PageDefinitionFormData,
  SectionDefinitionFormData,
  SectionDefinitionSchema,
} from "@/util/schemas/pageDefinitionsSchema";

export function usePageDefinitionsForm(defaultValues?: Partial<PageDefinitionFormData>) {
  return useForm<PageDefinitionFormData>({
    resolver: zodResolver(PageDefinitionSchema),
    defaultValues: {
      type: defaultValues?.type || "",
      description: null,
      identifier: defaultValues?.identifier || "",
      allowed_sections: defaultValues?.allowed_sections || [],
    },
  });
}

export function useSectionDefinitionsForm(defaultValues?: Partial<SectionDefinitionFormData>) {
  return useForm<SectionDefinitionFormData>({
    resolver: zodResolver(SectionDefinitionSchema),
    defaultValues: {
      type: defaultValues?.type || "",
      description: null,
      identifier: defaultValues?.identifier || "",
      allowed_sections: defaultValues?.allowed_sections || [],
    },
  });
}