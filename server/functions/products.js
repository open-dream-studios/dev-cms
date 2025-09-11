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
            serial_number, project_idx, customer_id, name, highlight, description, note,
            make, model, price, type, date_sold, job_type,
            repair_status, sale_status, length, width, ordinal
          )
          VALUES ${products
            .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .join(", ")}
          ON DUPLICATE KEY UPDATE
            customer_id = VALUES(customer_id),
            name = VALUES(name),
            highlight = VALUES(highlight),
            description = VALUES(description),
            note = VALUES(note),
            make = VALUES(make),
            model = VALUES(model),
            price = VALUES(price),
            type = VALUES(type),
            date_sold = VALUES(date_sold),
            job_type = VALUES(job_type),
            repair_status = VALUES(repair_status),
            sale_status = VALUES(sale_status),
            length = VALUES(length),
            width = VALUES(width),
            ordinal = VALUES(ordinal)
        `;

        const values = products.flatMap((p, i) => [
          !p.serial_number || p.serial_number.length < 14
            ? generateSerial(p.length, p.width, p.make, rows.length + i)
            : p.serial_number,
          project_idx,
          p.customer_id,
          p.name,
          p.highlight ?? null,
          p.description,
          p.note ?? "",
          p.make,
          p.model,
          p.price,
          p.type ?? "TSA",
          p.date_sold ? formatDateToMySQL(p.date_sold) : null,
          p.job_type,
          p.repair_status,
          p.sale_status,
          p.length,
          p.width,
          typeof p.ordinal === "number" ? p.ordinal : nextOrdinal + i,
        ]);

        db.query(q, values, (err, result) => {
          if (err) {
            console.error("DB error inserting/updating products:", err);
            return reject(err);
          }

          // Collect serial_numbers you just inserted/updated
          const serials = products.map((p) =>
            !p.serial_number || p.serial_number.length < 14
              ? generateSerial(p.length, p.width, p.make) // match what you inserted
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
