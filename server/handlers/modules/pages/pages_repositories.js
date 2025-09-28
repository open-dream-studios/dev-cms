// server/handlers/modules/pages/pages_repositories.js
import { db } from "../../../connection/connect.js";

// ---------- PAGE FUNCTIONS ----------
export const getPagesFunction = async (project_idx) => {
  const q = `
    SELECT *
    FROM project_pages pp
    WHERE pp.project_idx = ?
    ORDER BY pp.order_index ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);

    const pages = rows.map((r) => ({
      ...r,
      seo_keywords:
        typeof r.seo_keywords === "string"
          ? JSON.parse(r.seo_keywords)
          : r.seo_keywords || [],
    }));

    return pages;
  } catch (err) {
    console.error("❌ Function Error -> getPagesFunction: ", err);
    return [];
  }
};

export const upsertPageFunction = async (project_idx, reqBody) => {
  const {
    page_id,
    definition_id,
    title,
    slug,
    order_index,
    seo_title,
    seo_description,
    seo_keywords,
    template,
    published,
    parent_page_id,
  } = reqBody;

  try {
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
        order_index,
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
        order_index = VALUES(order_index),
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
      order_index,
      seo_title,
      seo_description,
      JSON.stringify(seo_keywords || []),
      template,
      published,
      parent_page_id,
    ];

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      page_id: finalPageId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertPageFunction: ", err);
    return {
      success: false,
      page_id: null,
    };
  }
};

export const deletePageFunction = async (project_idx, page_id) => {
  try {
    // 1. Look up the deleted page's order_index
    const [rows] = await db.promise().query(
      `SELECT order_index, parent_page_id 
       FROM project_pages 
       WHERE page_id = ? AND project_idx = ?`,
      [page_id, project_idx]
    );

    if (rows.length === 0) return false;
    const { order_index, parent_page_id } = rows[0];

    // 2. Delete the page
    await db
      .promise()
      .query(
        `DELETE FROM project_pages WHERE page_id = ? AND project_idx = ?`,
        [page_id, project_idx]
      );

    // 3. Shift down all siblings with higher order_index
    await db.promise().query(
      `UPDATE project_pages
       SET order_index = order_index - 1
       WHERE project_idx = ?
       AND (parent_page_id <=> ?)
       AND order_index > ?`,
      [project_idx, parent_page_id, order_index]
    );

    return true;
  } catch (err) {
    console.error("❌ Function Error -> deletePageFunction: ", err);
    return false;
  }
};

export const reorderPagesFunction = async (
  project_idx,
  parent_page_id,
  orderedPageIds
) => {
  try {
    const caseStatements = orderedPageIds
      .map((id, idx) => `WHEN ${db.escape(id)} THEN ${idx}`)
      .join(" ");

    const query = `
      UPDATE project_pages
      SET order_index = CASE page_id
        ${caseStatements}
      END
      WHERE project_idx = ?
      AND (parent_page_id <=> ?)
      AND page_id IN (${orderedPageIds.map(() => "?").join(", ")});
    `;

    const values = [project_idx, parent_page_id, ...orderedPageIds];

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      affectedRows: result.affectedRows || 0,
    };
  } catch (err) {
    console.error("❌ Function Error -> reorderPagesFunction:", err);
    return {
      success: false,
      affectedRows: 0,
    };
  }
};

// ---------- PAGE DEFINITION FUNCTIONS ----------
export const getPageDefinitionsFunction = async () => {
  const q = `SELECT * FROM page_definitions`;
  try {
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
  } catch (err) {
    console.error("❌ Function Error -> getPageDefinitionsFunction: ", err);
    return [];
  }
};

export const upsertPageDefinitionFunction = async (reqBody) => {
  const {
    page_definition_id,
    identifier,
    name,
    parent_page_definition_id,
    allowed_sections,
    config_schema,
  } = reqBody;

  try {
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

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      page_definition_id: finalPageDefinitionId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertPageDefinitionFunction: ", err);
    return {
      success: false,
      page_definition_id: null,
    };
  }
};

export const deletePageDefinitionFunction = async (page_definition_id) => {
  const q = `DELETE FROM page_definitions WHERE page_definition_id = ?`;
  try {
    await db.promise().query(q, [page_definition_id]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deletePageDefinitionFunction: ", err);
    return false;
  }
};

// ---------- PAGE DATA EXPORT FUNCTION ----------
export const getPageDataFunction = (reqBody) => {
  const { domain, slug } = reqBody;

  const projectQuery = `
    SELECT id from projects
    WHERE domain = ?
    LIMIT 1
  `;

  db.query(projectQuery, [domain], (err, idx) => {
    if (err) {
      console.error("❌ Fetch project error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!idx || idx.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project_idx = idx[0].id;

    const pageQuery = `
      SELECT id, title, slug
      FROM project_pages
      WHERE project_idx = ? AND slug = ?
      LIMIT 1
    `;

    db.query(pageQuery, [project_idx, slug], (err, pages) => {
      if (err) {
        console.error("❌ Fetch page error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (!pages || pages.length === 0) {
        return res.status(404).json({ error: "Page not found" });
      }

      const page = pages[0];

      const sectionQuery = `
        SELECT psec.id,
          psec.definition_id,
          psec.name,
          psec.config,
          psec.order_index,
          sd.identifier
        FROM project_sections psec
        LEFT JOIN section_definitions sd ON psec.definition_id = sd.id
        WHERE psec.project_page_id = ?
        ORDER BY psec.order_index ASC
`;

      db.query(sectionQuery, [page.id], (err, sections) => {
        if (err) {
          console.error("❌ Fetch sections error:", err);
          return res.status(500).json({ message: "Server error" });
        }

        // 3. Format the sections
        const formattedSections = sections.map((s) => ({
          id: s.id,
          identifier: s.identifier,
          name: s.name,
          order_index: s.order_index,
          config:
            typeof s.config === "string"
              ? JSON.parse(s.config)
              : s.config || {},
        }));

        const response = {
          title: page.title,
          slug: page.slug,
          sections: formattedSections,
        };

        return res.json(response);
      });
    });
  });
};
