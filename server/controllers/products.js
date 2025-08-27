// server/controllers/products.js
import dotenv from "dotenv";
import { db } from "../connection/connect.js";
import axios from "axios";
import {
  formatDateToMySQL,
  generateSerial,
} from "../functions/data.js";

dotenv.config();

export const getProducts = async (req, res) => {
  try {
    const { project_idx } = req.user;
    const q = "SELECT * FROM products WHERE project_idx = ?";
    db.query(q, [project_idx], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.json({ products: data });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching products" });
  }
};

export const updateProducts = async (req, res) => {
  try {
    const { project_idx } = req.user;
    const { products } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json("Missing products");
    }

    const result = await updateProductsDB(project_idx, products);
    return res.status(200).json({
      success: true,
      updated: result.affectedRows,
    });
  } catch (dbErr) {
    console.error("Error updating products:", dbErr);
    return res.status(500).json("Update failed");
  }
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

        const q = `
          INSERT INTO products (
            serial_number, project_idx, name, highlight, description, note,
            make, model, price, type, date_sold,
            repair_status, sale_status, length, width, images, ordinal
          )
          VALUES ${products
            .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .join(", ")}
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            highlight = VALUES(highlight),
            description = VALUES(description),
            note = VALUES(note),
            make = VALUES(make),
            model = VALUES(model),
            price = VALUES(price),
            type = VALUES(type),
            date_sold = VALUES(date_sold),
            repair_status = VALUES(repair_status),
            sale_status = VALUES(sale_status),
            length = VALUES(length),
            width = VALUES(width),
            images = VALUES(images),
            ordinal = VALUES(ordinal)
        `;

        const values = products.flatMap((p, i) => [
          !p.serial_number || p.serial_number.length < 14
            ? generateSerial(p.length, p.width, p.make, rows.length + i)
            : p.serial_number,
          project_idx,
          p.name,
          p.highlight ?? null,
          p.description,
          p.note ?? "",
          p.make,
          p.model,
          p.price,
          p.type ?? "TSA",
          p.date_sold ? formatDateToMySQL(p.date_sold) : null,
          p.repair_status,
          p.sale_status,
          p.length,
          p.width,
          JSON.stringify(Array.isArray(p.images) ? p.images : []),
          typeof p.ordinal === "number" ? p.ordinal : nextOrdinal + i,
        ]);

        db.query(q, values, (err, result) => {
          if (err) {
            console.error("DB error inserting/updating products:", err);
            return reject(err);
          }
          resolve(result);
        });
      }
    );
  });
};

export const deleteProducts = (req, res) => {
  const { project_idx } = req.user;
  const { serial_numbers } = req.body;

  if (!serial_numbers || serial_numbers.length === 0) {
    return res.status(400).json("Missing serial numbers");
  }

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res.status(500).json("Connection failed");
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json("Failed to start transaction");
      }

      const deleteQuery = `
        DELETE FROM products 
        WHERE project_idx = ? AND serial_number IN (${serial_numbers
          .map(() => "?")
          .join(",")})
      `;

      connection.query(
        deleteQuery,
        [project_idx, ...serial_numbers],
        (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json("Delete failed");
            });
          }
          if (result.affectedRows === 0) {
            return connection.rollback(() => {
              connection.release();
              res.status(200).json("No products were deleted");
            });
          }

          // Reindex only products for this project
          connection.query(`SET @rownum := -1`, (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json("Failed to reset rownum");
              });
            }

            const reindexQuery = `
                UPDATE products
                JOIN (
                  SELECT serial_number, (@rownum := @rownum + 1) AS new_ordinal
                  FROM products
                  WHERE project_idx = ?
                  ORDER BY ordinal
                ) AS ordered 
                ON products.serial_number = ordered.serial_number
                SET products.ordinal = ordered.new_ordinal
              `;

            connection.query(reindexQuery, [project_idx], (err, result2) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json("Reindex failed");
                });
              }

              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json("Commit failed");
                  });
                }

                connection.release();
                return res.status(200).json({
                  success: true,
                  deleted: serial_numbers.length,
                  reindexed: result2.affectedRows,
                });
              });
            });
          });
        }
      );
    });
  });
};