// server/handlers/modules/pages/sections_controllers.ts
import { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import {
  deleteSectionDefinitionFunction,
  deleteSectionFunction,
  getSectionDefinitionsFunction,
  getSectionsFunction,
  reorderSectionsFunction,
  upsertSectionDefinitionFunction,
  upsertSectionFunction,
} from "./sections_repositories.js";
import { Section, SectionDefinition } from "@open-dream/shared";

// ---------- SECTION CONTROLLERS ----------
export const getSections = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const sections: Section[] = await getSectionsFunction(project_idx);
  return { success: true, sections };
};

export const upsertSection = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { definition_id } = req.body;
  if (!project_idx || !definition_id)
    throw new Error("Missing required fields");
  return await upsertSectionFunction(connection, project_idx, req.body);
};

export const deleteSection = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { section_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !section_id) throw new Error("Missing required fields");
  return await deleteSectionFunction(connection, project_idx, section_id);
};

export const reorderSections = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { parent_section_id, orderedIds } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !Array.isArray(orderedIds))
    throw new Error("Missing required fields");
  const result = await reorderSectionsFunction(
    connection,
    project_idx,
    parent_section_id || null,
    orderedIds
  );
  return { success: true, updated: result.affectedRows };
};

// ---------- SECTION DEFINITION CONTROLLERS ----------
export const getSectionDefinitions = async (req: Request, res: Response) => {
  const sectionDefinitions: SectionDefinition[] = await getSectionDefinitionsFunction();
  return { sectionDefinitions };
};

export const upsertSectionDefinition = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  return await upsertSectionDefinitionFunction(connection, req.body);
};

export const deleteSectionDefinition = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { section_definition_id } = req.body;
  if (!section_definition_id) throw new Error("Missing required fields");
  return await deleteSectionDefinitionFunction(
    connection,
    section_definition_id
  );
};
