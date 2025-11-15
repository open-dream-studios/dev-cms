// project/src/modules/runFrontendModule.ts
import { moduleFunctions } from "@/modules/moduleFunctions";
import { RunModuleContext } from "@open-dream/shared";
import { makeRequest } from "@/util/axios";
import { toast } from "react-toastify";

export const moduleRequest = async (
  identifier: string,
  args: Record<string, any>
) => {
  const res = await makeRequest.post(`/api/modules/run/${identifier}`, args);
  return res.data;
};

export const runFrontendModule = async <T = any>(
  identifier: string,
  ctx: RunModuleContext
): Promise<T | null> => {
  const mod = moduleFunctions[identifier];
  if (!mod) {
    toast.error("Module not found on frontend");
    return null;
  }
  try {
    return await mod.run(ctx);
  } catch (e) {
    console.error(e);
    toast.error("Module failed");
    return null;
  }
};
