// server/handlers/modules/pages/sections_repositories.js
import { db } from "../../../connection/connect.js";

// ---------- SECTION FUNCTIONS ----------
export const getSectionsFunction = async (project_idx) => {
  const q = `
    SELECT *
    FROM project_sections ps
    WHERE ps.project_idx = ?
    ORDER BY ps.order_index ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    const sections = rows.map((r) => ({
      ...r,
      config:
        typeof r.config === "string" ? JSON.parse(r.config) : r.config || {},
    }));
    return sections;
  } catch (err) {
    console.error("❌ Function Error -> getSectionsFunction: ", err);
    return [];
  }
};

export const upsertSectionFunction = async (project_idx, reqBody) => {
  const {
    section_id,
    parent_section_id,
    project_page_id,
    definition_id,
    name,
    config,
    order_index,
  } = reqBody;

  try {
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
        order_index
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        parent_section_id = VALUES(parent_section_id),
        definition_id = VALUES(definition_id),
        name = VALUES(name),
        config = VALUES(config),
        order_index = VALUES(order_index),
        updated_at = NOW()
    `;

    const values = [
      finalSectionId,
      project_idx,
      parent_section_id,
      project_page_id,
      definition_id,
      name,
      config,
      order_index,
    ];

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      section_id: finalSectionId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertSectionFunction: ", err);
    return {
      success: false,
      section_id: null,
    };
  }
};

export const deleteSectionFunction = async (project_idx, section_id) => {
  try {
    // 1. Look up the section we’re deleting
    const [rows] = await db.promise().query(
      `SELECT order_index, parent_section_id, project_page_id
       FROM project_sections
       WHERE section_id = ? AND project_idx = ?`,
      [section_id, project_idx]
    );

    if (rows.length === 0) return false;
    const { order_index, parent_section_id, project_page_id } = rows[0];

    // 2. Delete the section
    await db.promise().query(
      `DELETE FROM project_sections 
       WHERE section_id = ? AND project_idx = ?`,
      [section_id, project_idx]
    );

    // 3. Shift siblings’ order_index down
    await db.promise().query(
      `UPDATE project_sections
       SET order_index = order_index - 1
       WHERE project_idx = ?
       AND project_page_id = ?
       AND (parent_section_id <=> ?)
       AND order_index > ?`,
      [project_idx, project_page_id, parent_section_id, order_index]
    );

    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteSectionFunction:", err);
    return false;
  }
};

export const reorderSectionsFunction = async (
  project_idx,
  parent_section_id,
  orderedSectionIds
) => {
  try {
    const caseStatements = orderedPageIds
      .map((id, idx) => `WHEN ${db.escape(id)} THEN ${idx}`)
      .join(" ");

    const query = `
      UPDATE project_sections
      SET order_index = CASE section_id
        ${caseStatements}
      END
      WHERE project_idx = ?
      AND (parent_section_id <=> ?)
      AND section_id IN (${orderedPageIds.map(() => "?").join(", ")});
    `;

    const values = [project_idx, parent_section_id, ...orderedSectionIds];

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      affectedRows: result.affectedRows || 0,
    };
  } catch (err) {
    console.error("❌ Function Error -> reorderSectionsFunction:", err);
    return {
      success: false,
      affectedRows: 0,
    };
  }
};

// ---------- SECTION DEFINITION FUNCTIONS ----------
export const getSectionDefinitionsFunction = async () => {
  const q = `SELECT * FROM section_definitions`;
  try {
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
  } catch (err) {
    console.error("❌ Function Error -> getSectionDefinitionsFunction: ", err);
    return [];
  }
};

export const upsertSectionDefinitionFunction = async (reqBody) => {
  const {
    section_definition_id,
    name,
    identifier,
    parent_section_definition_id,
    allowed_elements,
    config_schema,
  } = reqBody;

  try {
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

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      section_definition_id: finalSectionDefinitionId,
    };
  } catch (err) {
    console.error(
      "❌ Function Error -> upsertSectionDefinitionFunction: ",
      err
    );
    return {
      success: false,
      section_definition_id: null,
    };
  }
};

export const deleteSectionDefinitionFunction = async (
  section_definition_id
) => {
  const q = `DELETE FROM section_definitions WHERE section_definition_id = ?`;
  try {
    await db.promise().query(q, [section_definition_id]);
    return true;
  } catch (err) {
    console.error(
      "❌ Function Error -> deleteSectionDefinitionFunction: ",
      err
    );
    return false;
  }
};
