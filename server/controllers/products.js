// server/controllers/products.js
import dotenv from "dotenv";
import { db } from "../connection/connect.js";
import { updateProductsDB } from "../functions/products.js";

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