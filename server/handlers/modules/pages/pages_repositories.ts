// server/handlers/modules/pages/pages_repositories.ts
import { PageDefinition, ProjectPage } from "@open-dream/shared";
import { db } from "../../../connection/connect.js";
import {
  deleteAndReindex,
  getNextOrdinal,
  reorderOrdinals,
} from "../../../lib/ordinals.js";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ulid } from "ulid";

// ---------- PAGE FUNCTIONS ----------
export const getPagesFunction = async (
  project_idx: number
): Promise<ProjectPage[]> => {
  const q = `
    SELECT *
    FROM project_pages pp
    WHERE pp.project_idx = ?
    ORDER BY pp.ordinal ASC
  `;
  const [rows] = await db
    .promise()
    .query<(ProjectPage & RowDataPacket)[]>(q, [project_idx]);
  const pages = rows.map(
    (r: ProjectPage) =>
      ({
        ...r,
        seo_keywords:
          typeof r.seo_keywords === "string"
            ? JSON.parse(r.seo_keywords)
            : r.seo_keywords || [],
      } as ProjectPage)
  );
  return pages;
};

export const upsertPageFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
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
  const finalPageId = page_id?.trim() || `PAGE-${ulid()}`;

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

  const [result] = await connection.query<ResultSetHeader>(query, values);

  return {
    success: true,
    page_id: finalPageId,
  };
};

export const deletePageFunction = async (
  connection: PoolConnection,
  project_idx: number,
  page_id: string
) => {
  return await deleteAndReindex(
    connection,
    "project_pages",
    "page_id",
    page_id,
    ["project_idx", "parent_page_id"]
  );
};

export const reorderPagesFunction = async (
  connection: PoolConnection,
  project_idx: number,
  parent_page_id: number,
  orderedPageIds: number[]
) => {
  const layer = {
    project_idx,
    parent_page_id: parent_page_id ?? null,
  };
  return await reorderOrdinals(
    connection,
    "project_pages",
    layer,
    orderedPageIds,
    "page_id"
  );
};

// ---------- PAGE DEFINITION FUNCTIONS ----------
export const getPageDefinitionsFunction = async (): Promise<
  PageDefinition[]
> => {
  const q = `SELECT * FROM page_definitions`;
  const [rows] = await db
    .promise()
    .query<(PageDefinition & RowDataPacket)[]>(q, []);
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

export const upsertPageDefinitionFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const {
    page_definition_id,
    parent_page_definition_id,
    identifier,
    type,
    description,
    allowed_sections,
    config_schema,
  } = reqBody;

  const [rows] = await connection.query<any[]>(
    `
    SELECT *
    FROM page_definitions
    WHERE identifier = ?
    LIMIT 1
    `,
    [identifier]
  );

  if (
    rows.length > 0 &&
    (!page_definition_id || page_definition_id === rows[0].page_definition_id)
  ) {
    return {
      success: false,
      message: "Identifier already exists",
    };
  }

  const finalPageDefinitionId =
    page_definition_id?.trim() || `PAGEDEF-${ulid()}`;

  const query = `
    INSERT INTO page_definitions (
      page_definition_id,
      parent_page_definition_id,
      identifier,
      type,
      description,
      allowed_sections,
      config_schema
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      parent_page_definition_id = VALUES(parent_page_definition_id),
      identifier = VALUES(identifier),
      type = VALUES(type),
      description = VALUES(description),
      allowed_sections = VALUES(allowed_sections),
      config_schema = VALUES(config_schema)
  `;

  const values = [
    finalPageDefinitionId,
    parent_page_definition_id,
    identifier,
    type,
    description,
    JSON.stringify(allowed_sections || []),
    JSON.stringify(config_schema || {}),
  ];

  const [result] = await connection.query<ResultSetHeader>(query, values);

  return {
    success: true,
    page_definition_id: finalPageDefinitionId,
  };
};

export const deletePageDefinitionFunction = async (
  connection: PoolConnection,
  page_definition_id: string
) => {
  const q = `DELETE FROM page_definitions WHERE page_definition_id = ?`;
  await connection.query(q, [page_definition_id]);
  return { success: true };
};

// ---------- PAGE DATA EXPORT FUNCTION ----------
export const getPageDataFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { domain, slug } = reqBody;
  const projectQuery = `
    SELECT id from projects
    WHERE domain = ?
    LIMIT 1
  `;

  const [rows] = await connection.query<RowDataPacket[]>(projectQuery, [
    domain,
  ]);
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

  const [pageRows] = await connection.query<RowDataPacket[]>(pageQuery, [
    project_idx,
    slug,
  ]);
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
  const [sectionRows] = await connection.query<RowDataPacket[]>(sectionsQuery, [
    projectPage.id,
  ]);

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
