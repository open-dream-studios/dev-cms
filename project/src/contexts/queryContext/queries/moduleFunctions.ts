// project/src/contexts/queryContext/queries/moduleFunctions.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { ModuleDefinitionTree } from "@open-dream/shared";
import { moduleProcessors } from "../../../modules/moduleProcessors";
import { useProjectModules } from "./projectModules";

export function useModuleFunctions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const { projectModules } = useProjectModules(isLoggedIn, currentProjectId);
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

  const runModuleMutation = useMutation({
    mutationFn: async (params: { identifier: string; body: any }) => {
      const { identifier, body } = params;
      if (!currentProjectId) {
        throw new Error("No project selected");
      }
      const projectModuleIdentifiers = projectModules.map(
        (m) => m.module_identifier
      );
      if (!projectModuleIdentifiers.includes(identifier)) {
        console.warn(
          `Module "${identifier}" is not installed, request did not execute`
        );
        return null;
      }
      const res = await makeRequest.post(`/api/modules/run/${identifier}`, {
        project_idx: currentProjectId,
        body,
      });
      const processor = moduleProcessors[identifier];
      if (processor) {
        return processor(res.data);
      }
      return res.data;
    },
  });
  const runModule = async (identifier: string, body: any) => {
    return await runModuleMutation.mutateAsync({ identifier, body });
  };

  return {
    moduleDefinitionTree,
    isLoadingModuleDefinitionTree,
    refetchModuleDefinitionTree,
    runModule,
    isRunningModule: runModuleMutation.isPending,
  };
}
