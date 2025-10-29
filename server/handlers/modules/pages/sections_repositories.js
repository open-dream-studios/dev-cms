// server/handlers/modules/pages/sections_repositories.js
import { db } from "../../../connection/connect.js";
import { deleteAndReindex, reorderOrdinals } from "../../../lib/ordinals.js";

// ---------- SECTION FUNCTIONS ----------
export const getSectionsFunction = async (project_idx) => {
  const q = `
    SELECT *
    FROM project_sections ps
    WHERE ps.project_idx = ?
    ORDER BY ps.ordinal ASC
  `;
  const [rows] = await db.promise().query(q, [project_idx]);
  const sections = rows.map((r) => ({
    ...r,
    config:
      typeof r.config === "string" ? JSON.parse(r.config) : r.config || {},
  }));
  return sections;
};

export const upsertSectionFunction = async (
  connection,
  project_idx,
  reqBody
) => {
  const {
    section_id,
    parent_section_id,
    project_page_id,
    definition_id,
    name,
    config,
    ordinal,
  } = reqBody;

  const finalSectionId =
    section_id && section_id.trim() !== ""
      ? section_id
      : "PS-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

  const query = `
      INSERT INTO project_sections (
        section_id,
        project_idx,
        parent_section_id,
        project_page_id,
        definition_id,
        name,
        config,
        ordinal
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        parent_section_id = VALUES(parent_section_id),
        definition_id = VALUES(definition_id),
        name = VALUES(name),
        config = VALUES(config),
        ordinal = VALUES(ordinal),
        updated_at = NOW()
    `;

  const values = [
    finalSectionId,
    project_idx,
    parent_section_id,
    project_page_id,
    definition_id,
    name,
    JSON.stringify(config || {}),
    ordinal,
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    section_id: finalSectionId,
  };
};

export const deleteSectionFunction = async (
  connection,
  project_idx,
  section_id
) => {
  const result = await deleteAndReindex(
    connection,
    "project_sections",
    "section_id",
    section_id,
    ["project_idx", "parent_section_id"]
  );
  return result;
};

export const reorderSectionsFunction = async (
  connection,
  project_idx,
  parent_section_id,
  orderedSectionIds
) => {
  const layer = {
    project_idx,
    parent_section_id: parent_section_id ?? null,
  };
  const result = await reorderOrdinals(
    connection,
    "project_sections",
    layer,
    orderedSectionIds,
    "section_id"
  );
  return result;
};

// ---------- SECTION DEFINITION FUNCTIONS ----------
export const getSectionDefinitionsFunction = async () => {
  const q = `SELECT * FROM section_definitions`;
  const [rows] = await db.promise().query(q, []);

  const sectionDefinitions = rows.map((r) => ({
    ...r,
    allowed_elements:
      typeof r.allowed_elements === "string"
        ? JSON.parse(r.allowed_elements)
        : r.allowed_elements || [],
    config_schema:
      typeof r.config_schema === "string"
        ? JSON.parse(r.config_schema)
        : r.config_schema || {},
  }));
  return sectionDefinitions;
};

export const upsertSectionDefinitionFunction = async (connection, reqBody) => {
  const {
    section_definition_id,
    name,
    identifier,
    parent_section_definition_id,
    allowed_elements,
    config_schema,
  } = reqBody;

  const finalSectionDefinitionId =
    section_definition_id && section_definition_id.trim() !== ""
      ? section_definition_id
      : "PSD-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

  const query = `
      INSERT INTO section_definitions (
        section_definition_id,
        name,
        identifier,
        parent_section_definition_id,
        allowed_elements,
        config_schema
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        identifier = VALUES(identifier),
        parent_section_definition_id = VALUES(parent_section_definition_id),
        allowed_elements = VALUES(allowed_elements),
        config_schema = VALUES(config_schema)
    `;

  const values = [
    finalSectionDefinitionId,
    name,
    identifier,
    parent_section_definition_id,
    JSON.stringify(allowed_elements || []),
    JSON.stringify(config_schema || {}),
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    section_definition_id: finalSectionDefinitionId,
  };
};

export const deleteSectionDefinitionFunction = async (
  connection,
  section_definition_id
) => {
  const q = `DELETE FROM section_definitions WHERE section_definition_id = ?`;
  await connection.query(q, [section_definition_id]);
  return { success: true };
};
