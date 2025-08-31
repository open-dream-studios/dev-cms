// server/controllers/pageDefinitions.js
import { db } from "../connection/connect.js";
import { reorderProjectPagesDB } from "../functions/pages.js";

export const getAllPageDefinitions = (req, res) => {
  const q = `SELECT * FROM page_definitions`;

  db.query(q, (err, rows) => {
    if (err) {
      console.error("❌ Fetch page definitions error:", err);
      return res.status(500).json({ message: "Server error" });
    }

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

    return res.json({ pageDefinitions });
  });
};

export const upsertPageDefinition = (req, res) => {
  const {
    id,
    identifier,
    name,
    parent_page_definition_id,
    allowed_sections,
    config_schema,
  } = req.body;

  if (!identifier || !name) {
    return res.status(400).json({ message: "Missing identifier or name" });
  }

  // 1️⃣ Look up if identifier exists
  const qFind = "SELECT id FROM page_definitions WHERE identifier = ? LIMIT 1";

  db.query(qFind, [identifier], (err, results) => {
    if (err) {
      console.error("❌ Find page definition error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const existing = results[0];

    if (existing) {
      // 2️⃣ Identifier already exists
      if (!id) {
        return res.status(400).json({
          message: "Identifier already exists, must provide id to update",
        });
      }
      if (existing.id !== id) {
        return res.status(400).json({
          message: "Identifier exists but does not match provided id",
        });
      }

      // ✅ Safe to update
      const qUpdate = `
        UPDATE page_definitions
        SET name = ?, parent_page_definition_id = ?, allowed_sections = ?, config_schema = ?
        WHERE id = ?
      `;
      db.query(
        qUpdate,
        [
          name,
          parent_page_definition_id || null,
          JSON.stringify(allowed_sections || []),
          JSON.stringify(config_schema || {}),
          id,
        ],
        (err2) => {
          if (err2) {
            console.error("❌ Update page definition error:", err2);
            return res.status(500).json({ message: "Server error" });
          }
          return res.status(200).json({ message: "Page definition updated" });
        }
      );
    } else {
      // 3️⃣ Identifier does NOT exist
      if (id) {
        return res.status(400).json({
          message: "Identifier does not exist, cannot create with a preset id",
        });
      }

      // ✅ Safe to insert
      const qInsert = `
        INSERT INTO page_definitions (identifier, name, parent_page_definition_id, allowed_sections, config_schema)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        qInsert,
        [
          identifier,
          name,
          parent_page_definition_id || null,
          JSON.stringify(allowed_sections || []),
          JSON.stringify(config_schema || {}),
        ],
        (err3) => {
          if (err3) {
            console.error("❌ Insert page definition error:", err3);
            return res.status(500).json({ message: "Server error" });
          }
          return res.status(200).json({ message: "Page definition created" });
        }
      );
    }
  });
};

export const deletePageDefinition = (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Missing id" });
  }

  const q = `DELETE FROM page_definitions WHERE id = ?`;

  db.query(q, [id], (err) => {
    if (err) {
      console.error("❌ Delete page definition error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Page definition deleted" });
  });
};

export const addProjectPage = (req, res) => {
  const {
    id,
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
  } = req.body;
  const project_id = req.user?.project_idx;

  if (!project_id || !title || !slug) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (id) {
    // UPDATE by id
    const qUpdate = `
      UPDATE project_pages
      SET definition_id = ?, title = ?, slug = ?, order_index = ?, seo_title = ?,
          seo_description = ?, seo_keywords = ?, template = ?, published = ?,
          parent_page_id = ?, updated_at = NOW()
      WHERE id = ? AND project_id = ?
    `;
    db.query(
      qUpdate,
      [
        definition_id || null,
        title,
        slug,
        order_index || 0,
        seo_title || null,
        seo_description || null,
        JSON.stringify(seo_keywords || []),
        template || "default",
        published !== undefined ? published : true,
        parent_page_id || null,
        id,
        project_id,
      ],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(400)
              .json({ message: "Slug already exists for this project" });
          }
          console.error("❌ Update project page error:", err);
          return res.status(500).json({ message: "Server error" });
        }
        return res.status(200).json({ message: "Page updated" });
      }
    );
  } else {
    // INSERT
    const qInsert = `
      INSERT INTO project_pages (
        project_id, parent_page_id, definition_id, title, slug, order_index,
        seo_title, seo_description, seo_keywords, template, published
      )
      SELECT
        ? AS project_id,
        ? AS parent_page_id,
        ? AS definition_id,
        ? AS title,
        ? AS slug,
        COALESCE(MAX(order_index), -1) + 1,
        ? AS seo_title,
        ? AS seo_description,
        ? AS seo_keywords,
        ? AS template,
        ? AS published
      FROM project_pages
      WHERE project_id = ?;
    `;
    db.query(
      qInsert,
      [
        project_id, // project_id
        parent_page_id || null, // parent_page_id
        definition_id || null, // definition_id
        title, // title
        slug, // slug
        seo_title || null, // seo_title
        seo_description || null, // seo_description
        JSON.stringify(seo_keywords || []), // seo_keywords
        template || "default", // template
        published !== undefined ? published : true, // published
        project_id, // for WHERE project_id = ?
      ],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(400)
              .json({ message: "Slug already exists for this project" });
          }
          console.error("❌ Insert project page error:", err);
          return res.status(500).json({ message: "Server error" });
        }
        return res.status(200).json({ message: "Page created" });
      }
    );
  }
};

export const deleteProjectPage = (req, res) => {
  const { id } = req.body;
  const project_id = req.user?.project_idx;

  if (!project_id || !id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `DELETE FROM project_pages WHERE project_id = ? AND id = ?`;

  db.query(q, [project_id, id], (err) => {
    if (err) {
      console.error("❌ Delete project page error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Page removed" });
  });
};

export const getProjectPages = (req, res) => {
  const project_id = req.user?.project_idx;

  if (!project_id) {
    return res.status(400).json({ message: "Missing project_id" });
  }

  const q = `
    SELECT *
    FROM project_pages pp
    WHERE pp.project_id = ?
    ORDER BY pp.order_index ASC
  `;

  db.query(q, [project_id], (err, rows) => {
    if (err) {
      console.error("❌ Fetch project pages error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const projectPages = rows.map((r) => ({
      ...r,
      seo_keywords:
        typeof r.seo_keywords === "string"
          ? JSON.parse(r.seo_keywords)
          : r.seo_keywords || [],
    }));

    return res.json({ projectPages });
  });
};

export const reorderProjectPages = async (req, res) => {
  try {
    const { parent_page_id, orderedIds } = req.body;
    const project_idx = req.user?.project_idx;
    if (!project_idx || !Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await reorderProjectPagesDB(
      project_idx,
      parent_page_id || null,
      orderedIds
    );

    return res
      .status(200)
      .json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error("Error reordering project pages:", err);
    return res.status(500).json({ message: "DB error" });
  }
};