// project/src/modules/PagesModule/_actions/pages.actions.ts
import { useCurrentDataStore } from "@/store/currentDataStore";
import { deleteProjectPageApi } from "@/api/pages.api";
import { QueryClient } from "@tanstack/react-query";
import {
  ContextMenuDefinition,
  ProjectPage,
  Section,
} from "@open-dream/shared";

export const createPageContextMenu = (
  queryClient: QueryClient
): ContextMenuDefinition<ProjectPage> => ({
  items: [
    {
      id: "delete-page",
      label: "Delete Page",
      danger: true,
      onClick: async (page) => {
        await handleDeletePage(queryClient, page.page_id);
      },
    },
  ],
});

export const handleDeletePage = async (
  queryClient: QueryClient,
  page_id: string | null
) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !page_id) return;
  await deleteProjectPageApi(currentProjectId, page_id);
  queryClient.invalidateQueries({
    queryKey: ["projectPages", currentProjectId],
  });
};

export const createSectionContextMenu = (
  queryClient: QueryClient
): ContextMenuDefinition<Section> => ({
  items: [
    {
      id: "delete-section",
      label: "Delete Section",
      danger: true,
      onClick: async (section) => {
        await handleDeleteSection(queryClient, section.section_id);
      },
    },
  ],
});

export const handleDeleteSection = async (
  queryClient: QueryClient,
  section_id: string | null
) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !section_id) return;
  // await deleteProjectSectionApi(currentProjectId, section_id);
  queryClient.invalidateQueries({
    queryKey: ["projectSections", currentProjectId],
  });
};
