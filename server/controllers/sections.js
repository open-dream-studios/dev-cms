// server/controllers/sections.js
import { db } from "../connection/connect.js";

export const getAllSectionDefinitions = (req, res) => {
  const q = `SELECT * FROM section_definitions`;

  db.query(q, (err, rows) => {
    if (err) {
      console.error("❌ Fetch section definitions error:", err);
      return res.status(500).json({ message: "Server error" });
    }

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

    return res.json({ sectionDefinitions });
  });
};

export const upsertSectionDefinition = (req, res) => {
  const {
    id,
    identifier,
    name,
    parent_section_definition_id,
    allowed_elements,
    config_schema,
  } = req.body;

  if (!identifier || !name) {
    return res.status(400).json({ message: "Missing identifier or name" });
  }

  const qFind =
    "SELECT * FROM section_definitions WHERE id = ? LIMIT 1";

  db.query(qFind, [id], (err, results) => {
    if (err) {
      console.error("❌ Find section definition error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const existing = results[0];

    if (existing) {
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

      const qUpdate = `
        UPDATE section_definitions
        SET name = ?, identifier = ?, parent_section_definition_id = ?, allowed_elements = ?, config_schema = ?
        WHERE id = ?
      `;
      db.query(
        qUpdate,
        [
          name,
          identifier,
          parent_section_definition_id || null,
          JSON.stringify(allowed_elements || []),
          JSON.stringify(config_schema || {}),
          id,
        ],
        (err2) => {
          if (err2) {
            console.error("❌ Update section definition error:", err2);
            return res.status(500).json({ message: "Server error" });
          }
          return res
            .status(200)
            .json({ message: "Section definition updated" });
        }
      );
    } else {
      if (id) {
        console.log("400")
        return res.status(400).json({
          message: "Identifier does not exist, cannot create with a preset id",
        });
      }

      const qInsert = `
        INSERT INTO section_definitions (identifier, name, parent_section_definition_id, allowed_elements, config_schema)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        qInsert,
        [
          identifier,
          name,
          parent_section_definition_id || null,
          JSON.stringify(allowed_elements || []),
          JSON.stringify(config_schema || {}),
        ],
        (err3) => {
          if (err3) {
            console.error("❌ Insert section definition error:", err3);
            return res.status(500).json({ message: "Server error" });
          }
          return res
            .status(200)
            .json({ message: "Section definition created" });
        }
      );
    }
  });
};

export const deleteSectionDefinition = (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Missing id" });
  }

  const q = `DELETE FROM section_definitions WHERE id = ?`;

  db.query(q, [id], (err) => {
    if (err) {
      console.error("❌ Delete section definition error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Section definition deleted" });
  });
};

// --- SECTIONS ---
export const addSection = (req, res) => {
  const {
    id,
    definition_id,
    name,
    config,
    order_index,
    parent_section_id,
    project_page_id,
  } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !project_page_id || !name) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (id) {
    // UPDATE
    const qUpdate = `
      UPDATE project_sections
      SET definition_id = ?, name = ?, config = ?, order_index = ?, parent_section_id = ?, updated_at = NOW()
      WHERE id = ? AND project_idx = ?
    `;
    db.query(
      qUpdate,
      [
        definition_id || null,
        name,
        JSON.stringify(config || {}),
        order_index || 0,
        parent_section_id || null,
        id,
        project_idx,
      ],
      (err) => {
        if (err) {
          console.error("❌ Update section error:", err);
          return res.status(500).json({ message: "Server error" });
        }
        return res.status(200).json({ message: "Section updated" });
      }
    );
  } else {
    // INSERT
    const qInsert = `
      INSERT INTO project_sections (
        project_idx, project_page_id, parent_section_id, definition_id, name, config, order_index
      )
      SELECT
        ? AS project_idx,
        ? AS project_page_id,
        ? AS parent_section_id,
        ? AS definition_id,
        ? AS name,
        ? AS config,
        COALESCE(MAX(order_index), -1) + 1
      FROM project_sections
      WHERE project_idx = ? AND project_page_id = ?;
    `;
    db.query(
      qInsert,
      [
        project_idx,
        project_page_id,
        parent_section_id || null,
        definition_id || null,
        name,
        JSON.stringify(config || {}),
        project_idx,
        project_page_id,
      ],
      (err) => {
        if (err) {
          console.error("❌ Insert section error:", err);
          return res.status(500).json({ message: "Server error" });
        }
        return res.status(200).json({ message: "Section created" });
      }
    );
  }
};

export const deleteSection = (req, res) => {
  const { id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `DELETE FROM project_sections WHERE project_idx = ? AND id = ?`;

  db.query(q, [project_idx, id], (err) => {
    if (err) {
      console.error("❌ Delete section error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Section removed" });
  });
};

export const getSections = (req, res) => {
  const project_idx = req.user?.project_idx;
  const { project_page_id } = req.body;

  if (!project_idx || !project_page_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `
    SELECT *
    FROM project_sections
    WHERE project_idx = ? AND project_page_id = ?
    ORDER BY order_index ASC
  `;

  db.query(q, [project_idx, project_page_id], (err, rows) => {
    if (err) {
      console.error("❌ Fetch sections error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const sections = rows.map((r) => ({
      ...r,
      config:
        typeof r.config === "string" ? JSON.parse(r.config) : r.config || {},
    }));

    return res.json({ sections });
  });
};

export const reorderSections = (req, res) => {
  const { parent_section_id, orderedIds, project_page_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !project_page_id || !Array.isArray(orderedIds)) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const updates = orderedIds.map((id, index) => [
    index,
    project_idx,
    project_page_id,
    parent_section_id || null,
    id,
  ]);

  const q = `
    UPDATE project_sections
    SET order_index = ?
    WHERE project_idx = ? AND project_page_id = ? AND parent_section_id <=> ? AND id = ?
  `;

  let completed = 0;
  updates.forEach((row) => {
    db.query(q, row, (err) => {
      if (err) console.error("❌ Reorder sections error:", err);
      completed++;
      if (completed === updates.length) {
        return res.status(200).json({ message: "Sections reordered" });
      }
    });
  });
};
