// project/src/hooks/useSectionForm.ts
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectSectionsSchema,
  ProjectSectionsFormData,
} from "@/util/schemas/sectionSchema";
import { useForm } from "react-hook-form";

export const defaultProjectSectionsFormValues: ProjectSectionsFormData = {
  definition_id: null,
  name: "",
  config: {},
  order_index: undefined,
  parent_section_id: null,
  project_page_id: null,
};

export function useSectionForm(defaultValues?: Partial<ProjectSectionsFormData>) {
  return useForm<ProjectSectionsFormData>({
    resolver: zodResolver(ProjectSectionsSchema) as any, 
    mode: "onChange",
    defaultValues: { ...defaultProjectSectionsFormValues, ...defaultValues },
  });
}