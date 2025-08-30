// src/context/queryContext/queries/modules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Module } from "@/types/project";

export function useModules(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: modules = [],
    isLoading: isLoadingModules,
    refetch: refetchModules,
  } = useQuery<Module[]>({
    queryKey: ["modules"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/modules/get-all");
      return res.data.modules;
    },
    enabled: isLoggedIn,
  });

  const upsertModuleMutation = useMutation({
    mutationFn: async (data: {
      id?: number;
      name: string;
      description?: string;
      identifier: string;
      config_schema?: string[];
      parent_module_id: number | null;
    }) => {
      await makeRequest.post("/api/modules/upsert", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProjectId],
      });
    },
  });

  const upsertModule = async (data: {
    id?: number;
    name: string;
    description?: string;
    identifier: string;
    config_schema?: string[];
    parent_module_id: number | null;
  }) => {
    await upsertModuleMutation.mutateAsync(data);
  };
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await makeRequest.post("/api/modules/delete-module", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  const deleteModule = async (id: number) => {
    await deleteModuleMutation.mutateAsync(id);
  };

  return {
    modules,
    isLoadingModules,
    refetchModules,
    upsertModule,
    deleteModule,
  };
}
