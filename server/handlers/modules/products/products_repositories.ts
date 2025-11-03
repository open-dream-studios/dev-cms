// server/handlers/modules/products/products_repositories.ts
import { Product } from "@open-dream/shared";
import { db } from "../../../connection/connect.js";
import { generateSerial } from "../../../functions/data.js";
import { getNextOrdinal, reindexOrdinals } from "../../../lib/ordinals.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";

// ---------- PRODUCTS FUNCTIONS ----------
export const getProductsFunction = async (
  project_idx: number
): Promise<Product[]> => {
  const q = `
    SELECT * FROM products
    WHERE project_idx = ?
    ORDER BY ordinal ASC
  `;
  const [rows] = await db
    .promise()
    .query<(Product & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertProductsFunction = async (
  connection: PoolConnection,
  project_idx: number,
  products: Product[]
) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("No products provided");
  }

  let nextOrdinal = await getNextOrdinal(connection, "products", {
    project_idx,
  });

  const product_ids: string[] = [];

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
        : generateSerial(p.length, p.width, p.make);

    let finalOrdinal = p.ordinal;
    if (p.ordinal === null) {
      finalOrdinal = nextOrdinal;
      nextOrdinal += 1;
    }

    return [
      finalProductId,
      serialNumber,
      project_idx,
      p.name,
      p.customer_id ?? null,
      p.make ?? null,
      p.model ?? null,
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
        product_id, serial_number, project_idx, name, customer_id, 
        make, model, length, width, height, ordinal, description, note
      )
      VALUES ${products
        .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .join(", ")}
      ON DUPLICATE KEY UPDATE
        serial_number = VALUES(serial_number),
        name = VALUES(name),
        customer_id = VALUES(customer_id),
        make = VALUES(make),
        model = VALUES(model),
        length = VALUES(length),
        width = VALUES(width),
        height = VALUES(height),
        ordinal = VALUES(ordinal),
        description = VALUES(description),
        note = VALUES(note),
        updated_at = NOW()
    `;

  await connection.query(q, values);

  const [updatedRows] = await connection.query<RowDataPacket[]>(
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
  connection: PoolConnection,
  project_idx: number,
  product_ids: string[]
) => {
  const deleteQuery = `
      DELETE FROM products 
      WHERE project_idx = ? AND product_id IN (${product_ids
        .map(() => "?")
        .join(",")})
    `;
  const [deleteResult] = await connection.query<ResultSetHeader>(deleteQuery, [
    project_idx,
    ...product_ids,
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
  };
};
