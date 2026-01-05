// project/src/context/queryContext/queries/media.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Media } from "@open-dream/shared";
import {
  deleteProjectMediaApi,
  fetchProjectMediaApi,
  rotateProjectMediaApi,
  upsertProjectMediaApi,
} from "@/api/media.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function useMedia(isLoggedIn: boolean, currentProjectId: number | null) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: media = [],
    isLoading: isLoadingMedia,
    refetch: refetchMedia,
  } = useQuery<Media[]>({
    queryKey: ["media", currentProjectId],
    queryFn: async () => fetchProjectMediaApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !isPublic
  });

  const upsertMediaMutation = useMutation({
    mutationFn: async (items: Media[]) =>
      upsertProjectMediaApi(currentProjectId!, items),

    // 1. Optimistic update
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: ["media", currentProjectId],
      });

      const previousMedia = queryClient.getQueryData<Media[]>([
        "media",
        currentProjectId,
      ]);

      // Optimistically update the cache immediately
      queryClient.setQueryData<Media[]>(
        ["media", currentProjectId],
        (old = []) => {
          const updated = old.map((item) => {
            const idx = data.findIndex((i) => i.media_id === item.media_id);
            return idx > -1 ? { ...item, ordinal: data[idx].ordinal } : item;
          });
          return updated.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
        }
      );

      return { previousMedia };
    },

    // 2. If error, roll back
    onError: (_err, _new, context) => {
      if (context?.previousMedia) {
        queryClient.setQueryData(
          ["media", currentProjectId],
          context.previousMedia
        );
      }
    },

    // 3. After success, refetch to confirm
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
    },
  });

  const upsertMedia = async (items: Media[]): Promise<Media[]> => {
    if (!currentProjectId) throw new Error("Project ID is missing");
    return await upsertMediaMutation.mutateAsync(items);
  };

  const deleteMediaMutation = useMutation({
    mutationFn: async (media_id: string) =>
      deleteProjectMediaApi(currentProjectId!, media_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
    },
  });

  const deleteMedia = async (media_id: string) => {
    deleteMediaMutation.mutateAsync(media_id);
  };

  const rotateMediaMutation = useMutation({
    mutationFn: async ({
      media_id,
      url,
      rotations,
    }: {
      media_id: string;
      url: string;
      rotations: number;
    }) => rotateProjectMediaApi(currentProjectId!, media_id, url, rotations),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(
        ["media", currentProjectId],
        (old: Media[] = []) =>
          old.map((m) =>
            m.media_id === vars.media_id
              ? {
                  ...m,
                  version: data.version,
                  url: data.url,
                }
              : m
          )
      );
    },
  });

  const rotateMedia = async (
    media_id: string,
    url: string,
    rotations: number
  ) => {
    return await rotateMediaMutation.mutateAsync({ media_id, url, rotations });
  };

  return {
    media,
    isLoadingMedia,
    refetchMedia,
    upsertMedia,
    deleteMedia,
    rotateMedia,
  };
}
