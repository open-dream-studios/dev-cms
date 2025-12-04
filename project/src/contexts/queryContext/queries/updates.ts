// src/context/queryContext/queries/updates.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import type { Update } from "@open-dream/shared";
import { UpdateItemForm } from "@/util/schemas/updatesSchema";

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
    queryFn: async (): Promise<Update[]> => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/updates", {
        project_idx: currentProjectId,
      });
      const updates: Update[] = res.data.updates || [];

      const statusOrder: Record<Update["status"], number> = {
        requested: 0,
        upcoming: 1,
        in_progress: 2,
        completed: 3,
      };
      const priorityOrder: Record<Update["priority"], number> = {
        high: 0,
        medium: 1,
        low: 2,
      };

      return updates.sort((a, b) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: UpdateItemForm) => {
      const res = await makeRequest.post("/api/updates/upsert", {
        ...payload,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["updates", currentProjectId],
      });
    },
    onError: (err) => {
      console.error("❌ Upsert update failed:", err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (update_id: string) => {
      const res = await makeRequest.post("/api/updates/delete", {
        update_id,
        project_idx: currentProjectId,
      });
      return res.data;
    },
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
    }) => {
      const res = await makeRequest.post("/api/updates/toggleComplete", {
        update_id,
        completed,
        project_idx: currentProjectId,
      });
      return res.data;
    },
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
    mutationFn: async (payload: Partial<UpdateItemForm>) => {
      const res = await makeRequest.post("/api/updates/requests/add", {
        ...payload,
        project_idx: currentProjectId,
      });
      return res.data;
    },
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
    const res = await upsertMutation.mutateAsync(payload);
    return res;
  };

  const deleteUpdate = async (update_id: string) => {
    await deleteMutation.mutateAsync(update_id);
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
