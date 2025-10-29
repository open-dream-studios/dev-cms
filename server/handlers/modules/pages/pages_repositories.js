// server/handlers/modules/pages/pages_repositories.js
import { db } from "../../../connection/connect.js";
import {
  deleteAndReindex,
  getNextOrdinal,
  reorderOrdinals,
} from "../../../lib/ordinals.js";

// ---------- PAGE FUNCTIONS ----------
export const getPagesFunction = async (project_idx) => {
  const q = `
    SELECT *
    FROM project_pages pp
    WHERE pp.project_idx = ?
    ORDER BY pp.ordinal ASC
  `;
  const [rows] = await db.promise().query(q, [project_idx]);
  const pages = rows.map((r) => ({
    ...r,
    seo_keywords:
      typeof r.seo_keywords === "string"
        ? JSON.parse(r.seo_keywords)
        : r.seo_keywords || [],
  }));
  return pages;
};

export const upsertPageFunction = async (connection, project_idx, reqBody) => {
  const {
    page_id,
    definition_id,
    title,
    slug,
    seo_title,
    seo_description,
    seo_keywords,
    template,
    published,
    parent_page_id,
  } = reqBody;

  let finalOrdinal = 0;
  if (!page_id) {
    finalOrdinal = await getNextOrdinal(connection, "project_pages", {
      project_idx,
      parent_page_id,
    });
    if (finalOrdinal == null) return { success: false, page_id: null };
  }
  const finalPageId =
    page_id && page_id.trim() !== ""
      ? page_id
      : "P-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

  const query = `
      INSERT INTO project_pages (
        page_id,
        project_idx,
        definition_id,
        title,
        slug,
        ordinal,
        seo_title,
        seo_description,
        seo_keywords,
        template,
        published,
        parent_page_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        definition_id = VALUES(definition_id),
        title = VALUES(title),
        slug = VALUES(slug),
        seo_title = VALUES(seo_title),
        seo_description = VALUES(seo_description),
        seo_keywords = VALUES(seo_keywords),
        template = VALUES(template),
        published = VALUES(published),
        parent_page_id = VALUES(parent_page_id),
        updated_at = NOW()
    `;

  const values = [
    finalPageId,
    project_idx,
    definition_id,
    title,
    slug,
    finalOrdinal,
    seo_title,
    seo_description,
    JSON.stringify(seo_keywords || []),
    template,
    published,
    parent_page_id,
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    page_id: finalPageId,
  };
};

export const deletePageFunction = async (connection, project_idx, page_id) => {
  const result = await deleteAndReindex(
    connection,
    "project_pages",
    "page_id",
    page_id,
    ["project_idx", "parent_page_id"]
  );
  return result;
};

export const reorderPagesFunction = async (
  connection,
  project_idx,
  parent_page_id,
  orderedPageIds
) => {
  const layer = {
    project_idx,
    parent_page_id: parent_page_id ?? null,
  };
  const result = await reorderOrdinals(
    connection,
    "project_pages",
    layer,
    orderedPageIds,
    "page_id"
  );

  return result;
};

// ---------- PAGE DEFINITION FUNCTIONS ----------
export const getPageDefinitionsFunction = async () => {
  const q = `SELECT * FROM page_definitions`;
  const [rows] = await db.promise().query(q, []);
  const pageDefinitions = rows.map((r) => ({
    ...r,
    allowed_sections:
      typeof r.allowed_sections === "string"
        ? JSON.parse(r.allowed_sections)
        : r.allowed_sections || [],
    config_schema:
      typeof r.config_schema === "string"
        ? JSON.parse(r.config_schema)
        : r.config_schema || {},
  }));
  return pageDefinitions;
};

export const upsertPageDefinitionFunction = async (connection, reqBody) => {
  const {
    page_definition_id,
    identifier,
    name,
    parent_page_definition_id,
    allowed_sections,
    config_schema,
  } = reqBody;

  const finalPageDefinitionId =
    page_definition_id && page_definition_id.trim() !== ""
      ? page_definition_id
      : "PD-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

  const query = `
    INSERT INTO page_definitions (
      page_definition_id,
      identifier,
      name,
      parent_page_definition_id,
      allowed_sections,
      config_schema
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      identifier = VALUES(identifier),
      name = VALUES(name),
      parent_page_definition_id = VALUES(parent_page_definition_id),
      allowed_sections = VALUES(allowed_sections),
      config_schema = VALUES(config_schema)
  `;

  const values = [
    finalPageDefinitionId,
    identifier,
    name,
    parent_page_definition_id,
    JSON.stringify(allowed_sections || []),
    JSON.stringify(config_schema || {}),
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    page_definition_id: finalPageDefinitionId,
  };
};

export const deletePageDefinitionFunction = async (
  connection,
  page_definition_id
) => {
  const q = `DELETE FROM page_definitions WHERE page_definition_id = ?`;
  await connection.query(q, [page_definition_id]);
  return { success: true };
};

// ---------- PAGE DATA EXPORT FUNCTION ----------
export const getPageDataFunction = async (connection, reqBody) => {
  const { domain, slug } = reqBody;
  const projectQuery = `
    SELECT id from projects
    WHERE domain = ?
    LIMIT 1
  `;

  const [rows] = await connection.query(projectQuery, [domain]);
  if (!rows || !rows.length) {
    throw new Error("No project found");
  }
  const project_idx = rows[0].id;
  const pageQuery = `
    SELECT id, title, slug
    FROM project_pages
    WHERE project_idx = ? AND slug = ?
    LIMIT 1
  `;

  const [pageRows] = await connection.query(pageQuery, [project_idx, slug]);
  if (!pageRows || !pageRows.length) {
    throw new Error("No page found");
  }
  const projectPage = pageRows[0];
  const sectionsQuery = `
    SELECT psec.id,
      psec.definition_id,
      psec.name,
      psec.config,
      psec.ordinal,
      sd.identifier
    FROM project_sections psec
    LEFT JOIN section_definitions sd ON psec.definition_id = sd.id
    WHERE psec.project_page_id = ?
    ORDER BY psec.ordinal ASC
    `;
  const [sectionRows] = await connection.query(sectionsQuery, [projectPage.id]);

  if (!Array.isArray(sectionRows)) {
    throw new Error("Invalid section rows");
  }

  const formattedSections = sectionRows.map((s) => ({
    id: s.id,
    identifier: s.identifier,
    name: s.name,
    ordinal: s.ordinal,
    config:
      typeof s.config === "string" ? JSON.parse(s.config) : s.config || {},
  }));

  return {
    title: projectPage.title,
    slug: projectPage.slug,
    sections: formattedSections,
  };
};
