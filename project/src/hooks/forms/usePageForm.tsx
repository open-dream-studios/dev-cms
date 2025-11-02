// src/hooks/forms/usePageForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectPageSchema,
  ProjectPageFormData,
  pageToForm,
} from "@/util/schemas/projectPageSchema";
import { ProjectPage, Section } from "@shared/types/models/pages";
import { SubmitHandler } from "react-hook-form";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
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

export function usePageFormSubmit() {
  const { upsertProjectPage, projectPages } = useContextQueries();
  const {
    setAddingPage,
    setEditingPage,
    setSiteWindowKey,
    editingPage,
    addingPage,
  } = useUiStore();
  const { currentProjectId, currentPage, setCurrentPageData } =
    useCurrentDataStore();

  const onPageFormSubmit: SubmitHandler<ProjectPageFormData> = async (data) => {
    if (!currentProjectId || !data.definition_id) return;

    const newPage: ProjectPage = {
      project_idx: currentProjectId,
      page_id: editingPage?.page_id ?? null,
      parent_page_id: data?.parent_page_id ?? null,
      definition_id: data?.definition_id ?? null,
      title: data?.title ?? null,
      slug: data?.slug ?? null,
      ordinal: null,
      seo_title: data?.seo_title ?? null,
      seo_description: data?.seo_description ?? null,
      seo_keywords: data?.seo_keywords ?? null,
      template: data?.template ?? null,
      published: data?.published ?? null,
    };

    const newPageId = await upsertProjectPage(newPage);

    if (newPageId) {
      setCurrentPageData({
        ...newPage,
        page_id: newPageId,
      });
      setAddingPage(false);
      setEditingPage(null);
      setSiteWindowKey((prev) => prev + 1);
    }
  };

  return { onPageFormSubmit };
}

export function useSectionForm(section?: Section | null) {
  const defaultValues = sectionToForm(section);
  return useForm<SectionFormData>({
    resolver: zodResolver(SectionSchema) as any,
    defaultValues: defaultValues,
    mode: "onChange",
  });
}

export function useSectionFormSubmit() {
  const { upsertSection, projectSections } = useContextQueries();
  const {
    addingSection,
    setAddingSection,
    editingSection,
    setEditingSection,
    setSiteWindowKey,
  } = useUiStore();
  const {
    currentProjectId,
    currentPage,
    currentSection,
    setCurrentSectionData,
  } = useCurrentDataStore();

  const onSectionFormSubmit: SubmitHandler<SectionFormData> = async (data) => {
    if (!currentProjectId) return;

    const filteredActiveSections =
      currentSection === null
        ? projectSections.filter((p: Section) => p.parent_section_id === null)
        : projectSections.filter(
            (p) => p.parent_section_id === currentSection.id
          );

    const newSection: Section = {
      project_idx: currentProjectId,
      project_page_id: currentPage?.id ?? null,
      section_id: currentSection?.section_id ?? null,
      parent_section_id: data?.parent_section_id ?? null,
      definition_id: data?.definition_id ?? null,
      name: data?.name ?? null,
      config: data?.config ?? {},
      ordinal: addingSection
        ? filteredActiveSections.length
        : editingSection
        ? editingSection.ordinal
        : null,
    };

    const newSectionId = await upsertSection(newSection);

    if (newSectionId) {
      setCurrentSectionData({
        ...newSection,
        section_id: newSectionId,
      });
      setAddingSection(false);
      setEditingSection(null);
      setSiteWindowKey((prev) => prev + 1);
    }
  };

  return { onSectionFormSubmit };
}
