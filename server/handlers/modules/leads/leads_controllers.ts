// server/handlers/modules/leads/leads_controller.ts
import {
  getLeadsFunction,
  upsertLeadFunction,
  deleteLeadFunction,
} from "./leads_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";

export const getLeads = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const leads = await getLeadsFunction(project_idx);
  return { success: true, leads };
};

export const upsertLead = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  return await upsertLeadFunction(connection, project_idx, req.body);
};

export const deleteLead = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { lead_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !lead_id) throw new Error("Missing required fields");

  return await deleteLeadFunction(connection, project_idx, lead_id);
};
