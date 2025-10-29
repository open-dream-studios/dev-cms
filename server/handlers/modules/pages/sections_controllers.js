// server/handlers/modules/pages/sections_controllers.js
import {
  deleteSectionDefinitionFunction,
  deleteSectionFunction,
  getSectionDefinitionsFunction,
  getSectionsFunction,
  reorderSectionsFunction,
  upsertSectionDefinitionFunction,
  upsertSectionFunction,
} from "./sections_repositories.js";

// ---------- SECTION CONTROLLERS ----------
export const getSections = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const sections = await getSectionsFunction(project_idx);
  return { success: true, sections };
};

export const upsertSection = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  const { definition_id } = req.body;
  if (!project_idx || !definition_id)
    throw new Error("Missing required fields");
  return await upsertSectionFunction(connection, project_idx, req.body);
};

export const deleteSection = async (req, res, connection) => {
  const { section_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !section_id) throw new Error("Missing required fields");
  return await deleteSectionFunction(connection, project_idx, section_id);
};

export const reorderSections = async (req, res, connection) => {
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
export const getSectionDefinitions = async (req, res) => {
  const sectionDefinitions = await getSectionDefinitionsFunction();
  return { sectionDefinitions };
};

export const upsertSectionDefinition = async (req, res, connection) => {
  return await upsertSectionDefinitionFunction(connection, req.body);
};

export const deleteSectionDefinition = async (req, res, connection) => {
  const { section_definition_id } = req.body;
  if (!section_definition_id) throw new Error("Missing required fields");
  return await deleteSectionDefinitionFunction(
    connection,
    section_definition_id
  );
};
