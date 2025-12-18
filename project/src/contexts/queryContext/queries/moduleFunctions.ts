// project/src/contexts/queryContext/queries/moduleFunctions.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { ModuleDefinitionTree } from "@open-dream/shared";
import { useProjectModules } from "./projectModules";
import {
  fetchModuleDefinitionsApi,
  runModuleMutationApi,
} from "@/api/moduleFunctions.api";

export type RunModuleVariables = { identifier: string; body: any };
export type RunModuleResult =
  | { ok: true; data: any }
  | { ok: false; error: string };

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
    queryFn: async () => fetchModuleDefinitionsApi(),
    enabled: isLoggedIn,
  });

  const runModuleMutation = useMutation<
    RunModuleResult,
    never,
    RunModuleVariables
  >({
    mutationFn: async ({ identifier, body }) =>
      runModuleMutationApi(currentProjectId!, identifier, body, projectModules),
  });

  const runModule = async (identifier: string, body: any) => {
    try {
      return await runModuleMutation.mutateAsync({ identifier, body });
    } catch (err: any) {
      console.error(err);
    }
  };

  return {
    moduleDefinitionTree,
    isLoadingModuleDefinitionTree,
    refetchModuleDefinitionTree,
    runModule,
    isRunningModule: runModuleMutation.isPending,
  };
}
