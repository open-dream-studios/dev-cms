// project/src/hooks/usePageForm.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectPagesSchema } from "@/util/schemas/projectPagesSchema";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type PageFormData = z.infer<typeof ProjectPagesSchema>;

export function usePageForm(defaultValues?: Partial<PageFormData>) {
  return useForm({
    resolver: zodResolver(ProjectPagesSchema),
    defaultValues: {
      definition_id: defaultValues?.definition_id ?? null,
      title: defaultValues?.title ?? "",
      slug: defaultValues?.slug ?? "",
      order_index: defaultValues?.order_index,
      seo_title: defaultValues?.seo_title,
      seo_description: defaultValues?.seo_description,
      seo_keywords: defaultValues?.seo_keywords,
      template: defaultValues?.template,
      published: defaultValues?.published,
      parent_page_id: defaultValues?.parent_page_id ?? null,
    },
    mode: "onChange",
  });
}