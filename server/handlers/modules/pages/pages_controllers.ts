// server/handlers/modules/pages/pages_controllers.ts
import {
  deletePageDefinitionFunction,
  deletePageFunction,
  getPageDataFunction,
  getPageDefinitionsFunction,
  getPagesFunction,
  reorderPagesFunction,
  upsertPageDefinitionFunction,
  upsertPageFunction,
} from "./pages_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import type { PageDefinition, ProjectPage } from "@open-dream/shared";

// ---------- PAGE CONTROLLERS ----------
export const getPages = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const pages: ProjectPage[] = await getPagesFunction(project_idx);
  return { success: true, pages };
};

export const upsertPage = async (req: Request, res: Response,   connection: PoolConnection) => {
  const project_idx = req.user?.project_idx;
  const { title, slug, definition_id } = req.body;
  if (!project_idx || !title || !slug || !definition_id) {
    throw new Error("Missing required fields");
  }
  return await upsertPageFunction(connection, project_idx, req.body);
};

export const deletePage = async (req: Request, res: Response,   connection: PoolConnection) => {
  const { page_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !page_id) throw new Error("Missing required fields");
  return await deletePageFunction(connection, project_idx, page_id);
};

export const reorderPages = async (req: Request, res: Response,   connection: PoolConnection) => {
  const { parent_page_id, orderedIds } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !Array.isArray(orderedIds)) {
    throw new Error("Missing required fields");
  }
  const result = await reorderPagesFunction(
    connection,
    project_idx,
    parent_page_id || null,
    orderedIds
  );
  return { success: true, updated: result.affectedRows };
};

// ---------- PAGE DEFINITION CONTROLLERS ----------
export const getPageDefinitions = async (req: Request, res: Response) => {
  const pageDefinitions: PageDefinition[] = await getPageDefinitionsFunction();
  return { success: true, pageDefinitions };
};

export const upsertPageDefinition = async (req: Request, res: Response,   connection: PoolConnection) => {
  return await upsertPageDefinitionFunction(connection, req.body);
};

export const deletePageDefinition = async (req: Request, res: Response,   connection: PoolConnection) => {
  const { page_definition_id } = req.body;
  if (!page_definition_id) {
    throw new Error("Missing required fields");
  }
  return await deletePageDefinitionFunction(connection, page_definition_id);
};

// ---------- PAGE DATA EXPORT ----------
export const getPageData = async (req: Request, res: Response,   connection: PoolConnection) => {
  const { domain, slug } = req.body;
  if (!domain || !slug) {
    throw new Error("Missing domain or slug");
  }
  return await getPageDataFunction(connection, req.body);
};
