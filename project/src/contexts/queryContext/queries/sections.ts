// src/context/queryContext/queries/sections.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Section } from "@/types/pages";

export function useSections(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  currentPageId: number | null
) {
  const queryClient = useQueryClient();

  // Fetch sections for a page
  const {
    data: projectSections = [],
    isLoading: isLoadingSections,
    refetch: refetchSections,
  } = useQuery<Section[]>({
    queryKey: ["sections", currentProjectId, currentPageId],
    queryFn: async () => {
      if (!currentProjectId || !currentPageId) return [];
      const res = await makeRequest.post("/api/sections/get", {
        project_idx: currentProjectId,
      });
      return res.data.sections;
    },
    enabled: isLoggedIn && !!currentProjectId && !!currentPageId,
  });

  // Add or update a section
  const upsertSectionMutation = useMutation({
    mutationFn: async (data: Section) => {
      await makeRequest.post("/api/sections/upsert", {
        project_idx: currentProjectId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sections", currentProjectId, currentPageId],
      });
    },
  });

  // Delete section
  const deleteSectionMutation = useMutation({
    mutationFn: async (section_id: string) => {
      await makeRequest.post("/api/sections/delete", {
        project_idx: currentProjectId,
        section_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sections", currentProjectId, currentPageId],
      });
    },
  });

  // Reorder sections
  const reorderSectionsMutation = useMutation({
    mutationFn: async (data: {
      project_idx: number;
      project_page_id: number;
      parent_section_id: number | null;
      orderedIds: string[];
    }) => {
      await makeRequest.post("/api/sections/reorder", data);
    },
    onMutate: async (data) => {
      // optimistic update
      await queryClient.cancelQueries({
        queryKey: ["sections", currentProjectId, currentPageId],
      });

      const previousSections = queryClient.getQueryData<Section[]>([
        "sections",
        currentProjectId,
        currentPageId,
      ]);

      // if (previousSections) {
      //   queryClient.setQueryData<Section[]>(
      //     ["sections", currentProjectId, currentPageId],
      //     (old) => {
      //       if (!old) return old;
      //       const map = new Map(old.map((s) => [s.id, s]));
      //       return data.orderedIds
      //         .map((id) => map.get(id)!)
      //         .concat(old.filter((s) => !data.orderedIds.includes(s.id)));
      //     }
      //   );
      // }

      return { previousSections };
    },
    onError: (err, _, ctx) => {
      if (ctx?.previousSections) {
        queryClient.setQueryData(
          ["sections", currentProjectId, currentPageId],
          ctx.previousSections
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["sections", currentProjectId, currentPageId],
      });
    },
  });

  return {
    projectSections,
    isLoadingSections,
    refetchSections,
    upsertSection: (data: Section) => upsertSectionMutation.mutateAsync(data),
    deleteSection: (section_id: string) =>
      deleteSectionMutation.mutateAsync(section_id),
    reorderSections: (data: {
      project_idx: number;
      project_page_id: number;
      parent_section_id: number | null;
      orderedIds: string[];
    }) => reorderSectionsMutation.mutate(data),
  };
}
