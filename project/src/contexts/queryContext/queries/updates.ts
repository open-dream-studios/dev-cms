// project/src/context/queryContext/queries/updates.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Update } from "@open-dream/shared";
import { UpdateItemForm } from "@/util/schemas/updatesSchema";
import {
  addProjectUpdateRequestApi,
  deleteProjectUpdateApi,
  fetchProjectUpdatesApi,
  toggleProjectUpdateApi,
  upsertProjectUpdateApi,
} from "@/api/updates.api";

/**
 * Hook that mirrors your employees queries pattern.
 * Assumes endpoints:
 * POST /api/updates -> fetch updates (body: { project_idx })
 * POST /api/updates/upsert -> upsert an update item
 * POST /api/updates/delete -> delete update (body: { id, project_idx })
 * POST /api/updates/toggleComplete -> toggle complete (body: { id, completed })
 * POST /api/updates/requests/add -> add request (body: { ... })
 */

export function useUpdates(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: updatesData,
    isLoading: isLoadingUpdates,
    refetch: refetchUpdates,
  } = useQuery<Update[]>({
    queryKey: ["updates", currentProjectId],
    queryFn: async (): Promise<Update[]> =>
      fetchProjectUpdatesApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertUpdateMutation = useMutation({
    mutationFn: async (payload: UpdateItemForm) =>
      upsertProjectUpdateApi(currentProjectId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["updates", currentProjectId],
      });
    },
    onError: (err) => {
      console.error("❌ Upsert update failed:", err);
    },
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: async (update_id: string) =>
      deleteProjectUpdateApi(currentProjectId!, update_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["updates", currentProjectId],
      });
    },
    onError: (err) => {
      console.error("❌ Delete update failed:", err);
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({
      update_id,
      completed,
    }: {
      update_id: string;
      completed: boolean;
    }) => toggleProjectUpdateApi(currentProjectId!, update_id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["updates", currentProjectId],
      });
    },
    onError: (err) => {
      console.error("❌ Toggle complete failed:", err);
    },
  });

  const addRequestMutation = useMutation({
    mutationFn: async (payload: Partial<UpdateItemForm>) =>
      addProjectUpdateRequestApi(currentProjectId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["updates", currentProjectId],
      });
    },
    onError: (err) => {
      console.error("❌ Add request failed:", err);
    },
  });

  const upsertUpdate = async (payload: UpdateItemForm) => {
    const res = await upsertUpdateMutation.mutateAsync(payload);
    return res;
  };

  const deleteUpdate = async (update_id: string) => {
    await deleteUpdateMutation.mutateAsync(update_id);
  };

  const toggleComplete = async (update_id: string, completed: boolean) => {
    await toggleCompleteMutation.mutateAsync({ update_id, completed });
  };

  const addRequest = async (payload: Partial<UpdateItemForm>) => {
    await addRequestMutation.mutateAsync(payload);
  };

  return {
    updatesData,
    isLoadingUpdates,
    refetchUpdates,
    upsertUpdate,
    deleteUpdate,
    toggleComplete,
    addRequest,
  };
}
