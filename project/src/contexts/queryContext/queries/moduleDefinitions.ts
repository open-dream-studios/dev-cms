// src/context/queryContext/queries/modules.ts
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { ModuleDefinitionTree } from "@open-dream/shared";

export function useModuleDefinitions(isLoggedIn: boolean) {
  const {
    data: moduleDefinitionTree = {
      name: "",
      type: "folder",
      fullPath: "",
      children: [],
    },
    isLoading: isLoadingModuleDefinitionTree,
    refetch: refetchModuleDefinitionTree,
  } = useQuery<ModuleDefinitionTree>({
    queryKey: ["moduleDefinitions"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/modules/definitions");
      return res.data.moduleDefinitionTree;
    },
    enabled: isLoggedIn,
  });

  return {
    moduleDefinitionTree,
    isLoadingModuleDefinitionTree,
    refetchModuleDefinitionTree,
  };
}
