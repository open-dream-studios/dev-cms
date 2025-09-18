// server/functions/products.js
import { db } from "../connection/connect.js";
import { formatDateToMySQL, generateSerial } from "./data.js";

export const getSortedProducts = (project_idx) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM products WHERE project_idx = ?",
      [project_idx],
      (err, data) => {
        if (err) return reject(err);
        try {
          const sortedData = data.sort(
            (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
          );
          resolve(sortedData);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

export const updateProductsDB = (project_idx, products) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT serial_number, ordinal FROM products WHERE project_idx = ?`,
      [project_idx],
      (err, rows) => {
        if (err) {
          console.error("Error fetching existing products:", err);
          return reject(err);
        }

        const nextOrdinal =
          rows.length > 0
            ? Math.max(...rows.map((r) => r.ordinal ?? 0)) + 1
            : 0;

        if (!Array.isArray(products) || products.length === 0) {
          console.error(
            "updateProductsDB called with invalid products:",
            products
          );
          return reject(new Error("No products provided"));
        }

        const q = `
          INSERT INTO products (
            serial_number, project_idx, name, customer_id, highlight,
            make, model, type, length, width, height, ordinal, description, note
          )
          VALUES ${products
            .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .join(", ")}
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            customer_id = VALUES(customer_id),
            highlight = VALUES(highlight),
            make = VALUES(make),
            model = VALUES(model),
            type = VALUES(type),
            length = VALUES(length),
            width = VALUES(width),
            height = VALUES(height),
            ordinal = VALUES(ordinal),
            description = VALUES(description),
            note = VALUES(note)
        `;

        const values = products.flatMap((p, i) => [
          !p.serial_number || p.serial_number.length < 14
            ? generateSerial(p.length, p.width, p.make, rows.length + i)
            : p.serial_number,
          project_idx,
          p.name,
          p.customer_id,
          p.highlight ?? null,
          p.make,
          p.model,
          p.type ?? "TSA",
          p.length,
          p.width,
          p.height,
          typeof p.ordinal === "number" ? p.ordinal : nextOrdinal + i,
          p.description,
          p.note ?? "",
        ]);

        db.query(q, values, (err, result) => {
          if (err) {
            console.error("DB error inserting/updating products:", err);
            return reject(err);
          }

          // Collect serial_numbers you just inserted/updated
          const serials = products.map((p) =>
            !p.serial_number || p.serial_number.length < 14
              ? generateSerial(p.length, p.width, p.make) 
              : p.serial_number
          );

          // Now fetch their IDs
          db.query(
            `SELECT id, serial_number FROM products WHERE project_idx = ? AND serial_number IN (?)`,
            [project_idx, serials],
            (err, rows) => {
              if (err) {
                console.error("Error fetching updated IDs:", err);
                return reject(err);
              }

              const updatedIds = rows.map((r) => r.id);
              resolve(updatedIds);
            }
          );
        });
      }
    );
  });
};
