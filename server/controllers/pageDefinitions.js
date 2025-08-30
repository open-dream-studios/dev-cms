// server/controllers/pageDefinitions.js
import { db } from "../connection/connect.js";

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
    return res
      .status(400)
      .json({ message: "Missing identifier or name" });
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
          message:
            "Identifier already exists, must provide id to update",
        });
      }
      if (existing.id !== id) {
        return res.status(400).json({
          message:
            "Identifier exists but does not match provided id",
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
          message:
            "Identifier does not exist, cannot create with a preset id",
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
