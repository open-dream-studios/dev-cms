// server/handlers/projects/project_controllers.ts
import {
  deleteProjectFunction,
  deleteProjectUserFunction,
  getAllUserRolesFunction,
  getAssignedProjectsFunction,
  upsertProjectFunction,
  upsertProjectUserFunction,
} from "./projects_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import { Project } from "@open-dream/shared";

// ---------- PROJECT CONTROLLERS ----------
export const getAssignedProjects = async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  if (!userEmail) throw new Error("Missing user email");
  const projects: Project[] = await getAssignedProjectsFunction(userEmail);
  return { success: true, projects };
};

export const upsertProject = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { name } = req.body;
  if (!name) throw new Error("Missing required fields");
  return await upsertProjectFunction(connection, req.body);
};

export const deleteProject = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { project_id } = req.body;
  if (!project_id) throw new Error("Missing required fields");
  return await deleteProjectFunction(connection, project_id);
};

// ---------- PROJECT USER CONTROLLERS ----------
export const getAllUserRoles = async (req: Request, res: Response) => {
  const projectUsers = await getAllUserRolesFunction();
  return { success: true, projectUsers };
};

export const upsertProjectUser = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { email, project_idx, clearance } = req.body;
  if (!email || !project_idx || !clearance)
    throw new Error("Missing required fields");
  return await upsertProjectUserFunction(connection, req.body);
};

export const deleteProjectUser = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { email, project_idx } = req.body;
  if (!email || !project_idx) throw new Error("Missing required fields");
  return await deleteProjectUserFunction(connection, email, project_idx);
};
