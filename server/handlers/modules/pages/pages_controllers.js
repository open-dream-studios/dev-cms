// server/handlers/modules/pages/pages_controllers.js
import {
  deletePageDefinitionFunction,
  deletePageFunction,
  getPageDefinitionsFunction,
  getPagesFunction,
  reorderPagesFunction,
  upsertPageDefinitionFunction,
  upsertPageFunction,
} from "./pages_repositories.js";
import { db } from "../../../connection/connect.js";

// ---------- PAGE CONTROLLERS ----------
export const getPages = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const pages = await getPagesFunction(project_idx);
  return res.json({ pages });
};

export const upsertPage = async (req, res) => {
  const project_idx = req.user?.project_idx;
  const { title, slug, definition_id } = req.body;
  if (!project_idx) {
    return res
      .status(400)
      .json({ success: false, message: "Missing project_idx" });
  }
  if (!title || !slug || !definition_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const { page_id, success } = await upsertPageFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success, page_id });
};

export const deletePage = async (req, res) => {
  const { page_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !page_id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  const success = await deletePageFunction(project_idx, page_id);
  return res.status(success ? 200 : 500).json({ success });
};

export const reorderPages = async (req, res) => {
  try {
    const { parent_page_id, orderedIds } = req.body;
    const project_idx = req.user?.project_idx;
    if (!project_idx || !Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await reorderPagesFunction(
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

// ---------- PAGE DEFINITION CONTROLLERS ----------
export const getPageDefinitions = async (req, res) => {
  const pageDefinitions = await getPageDefinitionsFunction();
  return res.json({ pageDefinitions });
};

export const upsertPageDefinition = async (req, res) => {
  const { page_definition_id, success } = await upsertPageDefinitionFunction(
    req.body
  );
  return res.status(success ? 200 : 500).json({ success, page_definition_id });
};

export const deletePageDefinition = async (req, res) => {
  const { page_definition_id } = req.body;
  if (!page_definition_id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  const success = await deletePageDefinitionFunction(page_definition_id);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- PAGE DATA EXPORT ----------
export const getPageData = (req, res) => {
  const { domain, slug } = req.body;

  if (!domain || !slug) {
    return res.status(400).json({ message: "Missing domain or slug" });
  }

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
