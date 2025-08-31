// server/functions/pages.js
import { db } from "../connection/connect.js";

export const reorderProjectPagesDB = (project_idx, parent_page_id, orderedPageIds) => {
  return new Promise((resolve, reject) => {
    if (!orderedPageIds || orderedPageIds.length === 0) {
      return resolve({ affectedRows: 0 });
    }

    const caseStatements = orderedPageIds
      .map((id, idx) => `WHEN ${db.escape(id)} THEN ${idx}`)
      .join(" ");

    const q = `
      UPDATE project_pages
      SET order_index = CASE id
        ${caseStatements}
      END
      WHERE project_id = ?
      AND (parent_page_id <=> ?)
      AND id IN (${orderedPageIds.map(() => "?").join(",")})
    `;

    db.query(q, [project_idx, parent_page_id, ...orderedPageIds], (err, result) => {
      if (err) {
        console.error("Error reordering project pages:", err);
        return reject(err);
      }
      resolve(result);
    });
  });
};