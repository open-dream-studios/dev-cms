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
  } = useQuery({
    queryKey: ["sections", currentProjectId, currentPageId],
    queryFn: async () => {
      if (!currentProjectId || !currentPageId) return [];
      const res = await makeRequest.post("/api/sections/get", {
        project_idx: currentProjectId,
        project_page_id: currentPageId,
      });
      return res.data.sections;
    },
    enabled: isLoggedIn && !!currentProjectId && !!currentPageId,
  });

  // Add or update a section
  const addSectionMutation = useMutation({
    mutationFn: async (data: any) => {
      await makeRequest.post("/api/sections/add", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sections", currentProjectId, currentPageId],
      });
    },
  });

  // Delete section
  const deleteSectionMutation = useMutation({
    mutationFn: async (data: { project_idx: number; id: number }) => {
      await makeRequest.post("/api/sections/delete", data);
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
      orderedIds: number[];
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

      if (previousSections) {
        queryClient.setQueryData<Section[]>(
          ["sections", currentProjectId, currentPageId],
          (old) => {
            if (!old) return old;
            const map = new Map(old.map((s) => [s.id, s]));
            return data.orderedIds
              .map((id) => map.get(id)!)
              .concat(old.filter((s) => !data.orderedIds.includes(s.id)));
          }
        );
      }

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
    addSection: (data: any) => addSectionMutation.mutateAsync(data),
    deleteSection: (data: { project_idx: number; id: number }) =>
      deleteSectionMutation.mutateAsync(data),
    reorderSections: (data: {
      project_idx: number;
      project_page_id: number;
      parent_section_id: number | null;
      orderedIds: number[];
    }) => reorderSectionsMutation.mutate(data),
  };
}