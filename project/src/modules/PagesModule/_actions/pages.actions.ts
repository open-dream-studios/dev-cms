// project/src/modules/PagesModule/_actions/pages.actions.ts
import {
  setCurrentPageData,
  setCurrentSectionData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { deleteProjectPageApi, upsertProjectPageApi } from "@/api/pages.api";
import {
  ContextMenuDefinition,
  ProjectPage,
  Section,
} from "@open-dream/shared";
import {
  deleteProjectSectionsApi,
  upsertProjectSectionsApi,
} from "@/api/sections.api";
import { setSiteWindowKey, useUiStore } from "@/store/useUIStore";
import { ProjectPageFormData } from "@/util/schemas/projectPageSchema";
import { SectionFormData } from "@/util/schemas/sectionSchema";
import { queryClient } from "@/lib/queryClient";

export const createPageContextMenu =
  (): ContextMenuDefinition<ProjectPage> => ({
    items: [
      {
        id: "delete-page",
        label: "Delete Page",
        danger: true,
        onClick: async (page) => {
          await handleDeletePage(page.page_id);
        },
      },
    ],
  });

export const handleDeletePage = async (page_id: string | null) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !page_id) return;
  await deleteProjectPageApi(currentProjectId, page_id);
  queryClient.invalidateQueries({
    queryKey: ["projectPages", currentProjectId],
  });
};

export const createSectionContextMenu = (): ContextMenuDefinition<Section> => ({
  items: [
    {
      id: "delete-section",
      label: "Delete Section",
      danger: true,
      onClick: async (section) => {
        await handleDeleteSection(section.section_id);
      },
    },
  ],
});

export const handleDeleteSection = async (section_id: string | null) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !section_id) return;
  await deleteProjectSectionsApi(currentProjectId, section_id);
  queryClient.invalidateQueries({
    queryKey: ["sections", currentProjectId],
  });
};

export async function onPageFormSubmit(
  data: ProjectPageFormData
): Promise<void> {
  const { currentProjectId } = useCurrentDataStore.getState();
  const { editingPage, setEditingPage, setAddingPage } = useUiStore.getState();

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

  const newPageId = await upsertProjectPageApi(currentProjectId, newPage);
  queryClient.invalidateQueries({
    queryKey: ["projectPages", currentProjectId],
  });

  if (newPageId) {
    setCurrentPageData({
      ...newPage,
      page_id: newPageId,
    });
    setAddingPage(false);
    setEditingPage(null);
    setSiteWindowKey((prev) => prev + 1);
  }
}

export async function onSectionFormSubmit(
  data: SectionFormData
): Promise<void> {
  const { currentProjectId, currentPage, currentSection } =
    useCurrentDataStore.getState();
  const { addingSection, setAddingSection, editingSection, setEditingSection } =
    useUiStore.getState();
  if (!currentProjectId) return;
  const projectSections = queryClient.getQueryData<Section[]>([
    "sections",
    currentProjectId,
  ]);
  if (!projectSections) return;
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
  const { section_id } = await upsertProjectSectionsApi(
    currentProjectId,
    newSection
  );
  queryClient.invalidateQueries({
    queryKey: ["sections", currentProjectId],
  });

  if (section_id) {
    setCurrentSectionData({
      ...newSection,
      section_id,
    });
    setAddingSection(false);
    setEditingSection(null);
    setSiteWindowKey((prev) => prev + 1);
  }
}
