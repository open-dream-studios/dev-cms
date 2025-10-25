// server/handlers/modules/products/products_repositories.js
import { db } from "../../../connection/connect.js";
import { generateSerial } from "../../../functions/data.js";

// ---------- PRODUCTS FUNCTIONS ----------
export const getProductsFunction = async (project_idx) => {
  const q = `
    SELECT * FROM products
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
  } catch (err) {
    console.error("❌ Function Error -> getProductsFunction: ", err);
    return [];
  }
};

export const upsertProductsFunction = async (project_idx, products) => {
  try {
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("No products provided");
    }

    // Step 1: Get existing ordinals for this project
    const [existingRows] = await db
      .promise()
      .query(
        `SELECT serial_number, ordinal FROM products WHERE project_idx = ?`,
        [project_idx]
      );

    const nextOrdinal =
      existingRows.length > 0
        ? Math.max(...existingRows.map((r) => r.ordinal ?? 0)) + 1
        : 0;

    // Step 2: Prepare values & product_ids
    const product_ids = [];

    const values = products.flatMap((p, i) => {
      // Generate or reuse product_id
      const finalProductId =
        p.product_id && p.product_id.trim() !== ""
          ? p.product_id
          : "P-" +
            Array.from({ length: 10 }, () =>
              Math.floor(Math.random() * 10)
            ).join("");

      product_ids.push(finalProductId);

      // Generate or reuse serial number
      const serialNumber =
        p.serial_number && p.serial_number.trim() !== ""
          ? p.serial_number
          : generateSerial(p.length, p.width, p.make, existingRows.length + i);

      return [
        finalProductId,
        serialNumber,
        project_idx,
        p.name,
        p.customer_id ?? null,
        p.highlight ?? null,
        p.make ?? null,
        p.model ?? null,
        p.type ?? "TSA",
        p.length ?? null,
        p.width ?? null,
        p.height ?? null,
        typeof p.ordinal === "number" ? p.ordinal : nextOrdinal + i,
        p.description ?? null,
        p.note ?? "",
      ];
    });

    // Step 3: Build upsert query
    const q = `
      INSERT INTO products (
        product_id, serial_number, project_idx, name, customer_id, highlight,
        make, model, type, length, width, height, ordinal, description, note
      )
      VALUES ${products
        .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .join(", ")}
      ON DUPLICATE KEY UPDATE
        serial_number = VALUES(serial_number),
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
        note = VALUES(note),
        updated_at = NOW()
    `;

    // Step 4: Run upsert
    await db.promise().query(q, values);

    // Step 5: Fetch IDs of affected products
    const [updatedRows] = await db
      .promise()
      .query(
        `SELECT id, serial_number FROM products WHERE project_idx = ? AND product_id IN (?)`,
        [project_idx, product_ids]
      );

    const productIds = updatedRows.map((r) => r.id);

    // Step 6: Verify & resequence ordinals
    try {
      await db.promise().query(`SET @rownum := -1`);
      const resequenceQuery = `
        UPDATE products
        JOIN (
          SELECT id, (@rownum := @rownum + 1) AS new_ordinal
          FROM products
          WHERE project_idx = ?
          ORDER BY ordinal ASC, created_at ASC, id ASC
        ) AS ordered
        ON products.id = ordered.id
        SET products.ordinal = ordered.new_ordinal
      `;
      await db.promise().query(resequenceQuery, [project_idx]);
    } catch (verifyErr) {
      console.error("⚠️ Ordinal resequence failed:", verifyErr);
    }

    return {
      success: true,
      productIds,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertProductsFunction:", err);
    return {
      success: false,
      productIds: [],
    };
  }
};

export const deleteProductsFunction = async (project_idx, serial_numbers) => {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Step 1: Delete products
    const deleteQuery = `
      DELETE FROM products 
      WHERE project_idx = ? AND serial_number IN (${serial_numbers
        .map(() => "?")
        .join(",")})
    `;
    const [deleteResult] = await connection.query(deleteQuery, [
      project_idx,
      ...serial_numbers,
    ]);

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return { success: false, message: "No products were deleted" };
    }

    // Step 2: Reindex ordinals for remaining products
    await connection.query(`SET @rownum := -1`);

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

    const [reindexResult] = await connection.query(reindexQuery, [project_idx]);

    // Step 3: Commit
    await connection.commit();
    connection.release();

    return {
      success: true,
      deleted: deleteResult.affectedRows,
      reindexed: reindexResult.affectedRows,
    };
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("❌ Function Error -> deleteProductsFunction:", err);
    return { success: false, error: "Delete transaction failed" };
  }
};
