// server/functions/products.js
import { db } from "../connection/connect.js";

export const getSortedProducts = (project_idx) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM products WHERE project_idx = ?", [project_idx], (err, data) => {
      if (err) return reject(err);
      try {
        const sortedData = data.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
        resolve(sortedData);
      } catch (err) {
        reject(err);
      }
    });
  });
};