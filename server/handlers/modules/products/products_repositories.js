// server/handlers/modules/products/products_repositories.js
import { db } from "../../../connection/connect.js";
import { generateSerial } from "../../../functions/data.js";
import { getNextOrdinal, reindexOrdinals } from "../../../lib/ordinals.js";

// ---------- PRODUCTS FUNCTIONS ----------
export const getProductsFunction = async (project_idx) => {
  const q = `
    SELECT * FROM products
    WHERE project_idx = ?
    ORDER BY ordinal DESC
  `;
  const [rows] = await db.promise().query(q, [project_idx]);
  return rows;
};

export const upsertProductsFunction = async (
  connection,
  project_idx,
  products
) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("No products provided");
  }

  let nextOrdinal = await getNextOrdinal(connection, "products", {
    project_idx,
  });

  const product_ids = [];

  const values = products.flatMap((p, i) => {
    const finalProductId =
      p.product_id && p.product_id.trim() !== ""
        ? p.product_id
        : "P-" +
          Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
            ""
          );
    product_ids.push(finalProductId);

    const serialNumber =
      p.serial_number && p.serial_number.trim() !== ""
        ? p.serial_number
        : generateSerial(p.length, p.width, p.make, existingRows.length + i);

    let finalOrdinal = p.ordinal;
    if (!p.ordinal) {
      finalOrdinal = nextOrdinal;
      nextOrdinal += 1;
    }

    return [
      finalProductId,
      serialNumber,
      project_idx,
      p.name,
      p.customer_id ?? null,
      p.highlight ?? null,
      p.make ?? null,
      p.model ?? null,
      p.type ?? "product",
      p.length ?? null,
      p.width ?? null,
      p.height ?? null,
      finalOrdinal,
      p.description ?? null,
      p.note ?? "",
    ];
  });

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

  await connection.query(q, values);

  const [updatedRows] = await connection.query(
    `SELECT id, serial_number FROM products WHERE project_idx = ? AND product_id IN (?)`,
    [project_idx, product_ids]
  );
  const productIds = updatedRows.map((r) => r.id);

  await reindexOrdinals(connection, "products", {
    project_idx,
  });

  return {
    success: true,
    productIds,
  };
};

export const deleteProductsFunction = async (
  connection,
  project_idx,
  serial_numbers
) => {
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
    throw new Error("No products were deleted");
  }

  await reindexOrdinals(connection, "products", {
    project_idx,
  });

  return {
    success: true,
    deleted: deleteResult.affectedRows,
    reindexed: reindexResult.affectedRows,
  };
};
