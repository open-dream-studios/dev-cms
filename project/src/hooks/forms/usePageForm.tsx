// src/hooks/forms/usePageForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectPageSchema,
  ProjectPageFormData,
  pageToForm,
} from "@/util/schemas/projectPageSchema";
import { ProjectPage, Section } from "@open-dream/shared";
import {
  SectionFormData,
  SectionSchema,
  sectionToForm,
} from "@/util/schemas/sectionSchema";

export function usePageForm(page?: ProjectPage | null) {
  const defaultValues = pageToForm(page);
  return useForm<ProjectPageFormData>({
    resolver: zodResolver(ProjectPageSchema),
    defaultValues: defaultValues,
    mode: "onChange",
  });
}

export function useSectionForm(section?: Section | null) {
  const defaultValues = sectionToForm(section);
  return useForm<SectionFormData>({
    resolver: zodResolver(SectionSchema) as any,
    defaultValues: defaultValues,
    mode: "onChange",
  });
}