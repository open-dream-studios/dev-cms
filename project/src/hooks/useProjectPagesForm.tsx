// project/src/hooks/usePageForm.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectPagesFormData, ProjectPagesSchema } from "@/util/schemas/projectPagesSchema";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type PageFormData = z.infer<typeof ProjectPagesSchema>;

export const defaultProjectPagesFormValues: ProjectPagesFormData = {
  definition_id: null,
  title: "",
  slug: "",
  order_index: undefined,
  seo_title: "",
  seo_description: "",
  seo_keywords: [],
  template: "default",
  published: true,
  parent_page_id: null,
};

export function usePageForm(defaultValues?: Partial<PageFormData>) {
  return useForm({
    resolver: zodResolver(ProjectPagesSchema),
    mode: "onChange",
  });
}