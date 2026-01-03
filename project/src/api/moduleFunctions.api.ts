// project/src/api/moduleFunctions.api.ts
import { RunModuleResult } from "@/contexts/queryContext/queries";
import { moduleProcessors } from "@/modules/moduleProcessors";
import { makeRequest } from "@/util/axios";
import { ProjectModule } from "@open-dream/shared";

export async function fetchModuleDefinitionsApi() {
  const res = await makeRequest.post("/modules/definitions");
  return res.data.moduleDefinitionTree || {};
}

export async function runModuleMutationApi(
  project_idx: number,
  identifier: string,
  body: any,
  projectModules: ProjectModule[]
): Promise<RunModuleResult> {
  if (!project_idx) {
    return { ok: false, error: "No project selected" };
  }

  const projectModuleIdentifiers = projectModules.map(
    (m) => m.module_identifier
  );

  if (!projectModuleIdentifiers.includes(identifier)) {
    console.warn(`Module "${identifier}" is not installed`);
    return { ok: false, error: "Module not installed" };
  }

  const res = await makeRequest
    .post(`/modules/run/${identifier}`, {
      project_idx,
      body,
    })
    .catch((err) => {
      const msg =
        err?.response?.data?.error || err.message || "Unknown module error";

      return { data: { error: msg }, __error: true as const };
    });

  if ("__error" in res) {
    return { ok: false, error: res.data.error };
  }

  const processor = moduleProcessors[identifier];
  return {
    ok: true,
    data: processor ? processor(res.data) : res.data,
  };
}
