// server/controllers/products.js
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { db } from "../connection/connect.js";
import { google } from "googleapis";
import axios from "axios";
import {
  formatDateToMySQL,
  formatSQLDate,
  generateSerial,
} from "../functions/data.js";
import { decrypt } from "../util/crypto.js";

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

export const syncToGoogleSheets = async (req, res) => {
  try {
    const { project_idx } = req.user;

    // 1. Look up the integration for Google Sheets
    const moduleQ = `
      SELECT pi.config 
      FROM project_integrations pi
      JOIN modules m ON pi.module_id = m.id
      WHERE pi.project_idx = ? AND m.identifier = 'products-export-to-sheets-module'
      LIMIT 1
    `;

    db.query(moduleQ, [project_idx], (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (!rows.length) {
        return res
          .status(400)
          .json({ message: "Google Sheets not configured" });
      }

      let configRow = rows[0].config;

      // If MySQL column type is JSON, it’s already an object.
      // If it's TEXT, it may still be a string.
      if (typeof configRow === "string") {
        try {
          configRow = JSON.parse(configRow);
        } catch (err) {
          console.error("Config JSON parse failed:", err);
          return res
            .status(500)
            .json({ message: "Invalid integration config" });
        }
      }

      const encryptedConfig = configRow;
      const config = {};

      for (const [key, value] of Object.entries(encryptedConfig)) {
        try {
          const decrypted = decrypt(value);
          config[key] = decrypted || value;
        } catch {
          config[key] = value;
        }
      }

      const { spreadsheetId, sheetName, serviceAccountJson } = config;

      // 2. Validate presence
      if (!spreadsheetId || !sheetName || !serviceAccountJson) {
        return res.status(400).json({ message: "Missing Sheets credentials" });
      }

      // 3. Fetch products
      console.log("TESTING", project_idx);
      db.query(
        "SELECT * FROM products WHERE project_idx = ?",
        [project_idx],
        async (err, data) => {
          if (err) return res.status(500).json(err);
          console.log(data);

          try {
            const sortedData = data.sort(
              (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
            );

            const rows = sortedData.map((row, index) => [
              index + 1,
              row.serial_number,
              row.name,
              row.description || "",
              row.note || "",
              row.make || "",
              row.model || "",
              row.price || "",
              row.type || "",
              formatSQLDate(row.date_entered),
              formatSQLDate(row.date_sold),
              row.repair_status,
              row.sale_status,
              row.length || "",
              row.width || "",
              Array.isArray(row.images)
                ? row.images.join(" ")
                : typeof row.images === "string"
                ? JSON.parse(row.images || "[]").join(" ")
                : "",
            ]);

            const header = [
              "ID",
              "Serial Number",
              "Name",
              "Description",
              "Note",
              "Make",
              "Model",
              "Price ($)",
              "Type",
              "Date Entered",
              "Date Sold",
              "Repair Status",
              "Sale Status",
              "Length (in)",
              "Width (in)",
              "Images",
            ];

            const parsed = JSON.parse(serviceAccountJson);
            parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");

            const auth = new google.auth.GoogleAuth({
              credentials: parsed,
              scopes: ["https://www.googleapis.com/auth/spreadsheets"],
            });

            const sheets = google.sheets({ version: "v4", auth });

            await sheets.spreadsheets.values.clear({
              spreadsheetId: spreadsheetId,
              range: `${sheetName}!A1:ZZZ`,
            });

            await sheets.spreadsheets.values.update({
              spreadsheetId: spreadsheetId,
              range: `${sheetName}!A1:ZZZ`,
              valueInputOption: "RAW",
              requestBody: { values: [header, ...rows] },
            });

            return res.json({ success: true });
          } catch (e) {
            console.error(e);
            return res.status(500).json("Google Sheets sync failed.");
          }
        }
      );
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json("Unexpected error syncing with Google Sheets.");
  }
};

export const syncToWix = async (req, res) => {
  try {
    const { project_idx } = req.user;

    const q = "SELECT * FROM products WHERE project_idx = ?";
    db.query(q, [project_idx], async (err, data) => {
      if (err) return res.status(500).json(err);

      const sortedData = data
        .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
        .reverse();

      const corrected_data = sortedData.map((item) => ({
        serialNumber: item.serial_number,
        sold: !!item.date_sold,
        name: item.name,
        description_fld: item.description || "",
        make: item.make || "",
        model: item.model || "",
        price: parseFloat(item.price) || 0,
        length: parseFloat(item.length) || 0,
        width: parseFloat(item.width) || 0,
        images:
          item.images?.filter((url) => !/\.(mp4|mov)$/i.test(url)).join(" ") ||
          "",
      }));

      try {
        await axios.post(
          "https://tannyspaacquisitions.com/_functions/addHotTub",
          corrected_data,
          {
            headers: {
              Authorization: `Bearer ${process.env.WIX_GENERATED_SECRET}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
            validateStatus: (status) => status < 500,
          }
        );
        return res.status(200).json({ success: true });
      } catch (err) {
        console.error(
          "Failed to sync with Wix:",
          err.response?.data || err.message
        );
        return res.status(500).json("Wix sync failed.");
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json("Unexpected error syncing with Wix.");
  }
};
