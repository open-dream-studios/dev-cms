// server/handlers/modules/calls/calls_controllers.ts
import { ProjectCall } from "@open-dream/shared";
import { getCallsByProjectFunction } from "./calls_repositories.js";
import type { Request, Response } from "express";

// ---------- CALLS CONTROLLERS ----------
export const getCallsByProject = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const projectCalls: ProjectCall[] = await getCallsByProjectFunction(project_idx);
  return { success: true, projectCalls };
};
