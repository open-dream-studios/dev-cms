// src/context/queryContext/queries/sections.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Section } from "@open-dream/shared";
import {
  deleteProjectSectionsApi,
  fetchProjectSectionsApi,
  reorderProjectSectionsApi,
  upsertProjectSectionsApi,
} from "@/api/sections.api";

export function useSections(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  currentPageId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: projectSections = [],
    isLoading: isLoadingSections,
    refetch: refetchSections,
  } = useQuery<Section[]>({
    queryKey: ["sections", currentProjectId, currentPageId],
    queryFn: async () => fetchProjectSectionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !!currentPageId,
  });

  const upsertSectionMutation = useMutation({
    mutationFn: async (data: Section) =>
      upsertProjectSectionsApi(currentProjectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sections", currentProjectId, currentPageId],
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (section_id: string) =>
      deleteProjectSectionsApi(currentProjectId!, section_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sections", currentProjectId, currentPageId],
      });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (data: {
      project_idx: number;
      project_page_id: number;
      parent_section_id: number | null;
      orderedIds: string[];
    }) => reorderProjectSectionsApi(currentProjectId!, data),
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

  const upsertSection = async (section: Section) => {
    const res = await upsertSectionMutation.mutateAsync(section);
    return res.section_id;
  };

  const deleteSection = async (section_id: string) => {
    await deleteSectionMutation.mutateAsync(section_id);
  };

  return {
    projectSections,
    isLoadingSections,
    refetchSections,
    upsertSection,
    deleteSection,
    reorderSections: (data: {
      project_idx: number;
      project_page_id: number;
      parent_section_id: number | null;
      orderedIds: string[];
    }) => reorderSectionsMutation.mutate(data),
  };
}
