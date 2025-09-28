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
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const sections = await getSectionsFunction(project_idx);
  return res.json({ sections });
};

export const upsertSection = async (req, res) => {
  const project_idx = req.user?.project_idx;
  const { title, slug } = req.body;
  if (!project_idx) {
    return res
      .status(400)
      .json({ success: false, message: "Missing project_idx" });
  }
  if (!title || !slug) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const { section_id, success } = await upsertSectionFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success, section_id });
};

export const deleteSection = async (req, res) => {
  const { section_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !section_id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  const success = await deleteSectionFunction(project_idx, section_id);
  return res.status(success ? 200 : 500).json({ success });
};

export const reorderSections = async (req, res) => {
  try {
    const { parent_section_id, orderedIds } = req.body;
    const project_idx = req.user?.project_idx;
    if (!project_idx || !Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await reorderSectionsFunction(
      project_idx,
      parent_section_id || null,
      orderedIds
    );

    return res
      .status(200)
      .json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error("Error reordering project sections:", err);
    return res.status(500).json({ message: "DB error" });
  }
};

// ---------- SECTION DEFINITION CONTROLLERS ----------
export const getSectionDefinitions = async (req, res) => {
  const sectionDefinitions = await getSectionDefinitionsFunction();
  return res.json({ sectionDefinitions });
};

export const upsertSectionDefinition = async (req, res) => {
  const { section_definition_id, success } = await upsertSectionDefinitionFunction(req.body);
  return res.status(success ? 200 : 500).json({ success, section_definition_id });
};

export const deleteSectionDefinition = async (req, res) => {
  const { section_definition_id } = req.body;
  if (!section_definition_id) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  const success = await deleteSectionDefinitionFunction(section_definition_id);
  return res.status(success ? 200 : 500).json({ success });
};