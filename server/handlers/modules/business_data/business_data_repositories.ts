// server/handlers/modules/business_data/business_data_repositories.ts
import { db } from "../../../connection/connect.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";

export const getBusinessDataFunction = async (
  project_idx: number
) => {
  const q = `
    SELECT *
    FROM business_data
    WHERE project_idx = ?
    LIMIT 1
  `;

  const [rows] = await db
    .promise()
    .query<(RowDataPacket & {
      id: number;
      business_id: string;
      project_idx: number;
      business_rating: number | null;
      business_review_count: number | null;
    })[]>(q, [project_idx]);

  return rows[0] || null;
};

export const upsertBusinessDataFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: {
    business_id?: string;
    business_rating?: number | null;
    business_review_count?: number | null;
  }
) => {
  const {
    business_id,
    business_rating = null,
    business_review_count = null,
  } = reqBody;

  /**
   * 1️⃣ Check if a row already exists for this project
   */
  const [existingRows] = await connection.query<RowDataPacket[]>(
    `
      SELECT id, business_id
      FROM business_data
      WHERE project_idx = ?
      LIMIT 1
    `,
    [project_idx]
  );

  // --------------------------------------------------
  // UPDATE EXISTING ROW
  // --------------------------------------------------
  if (existingRows.length) {
    const existingId = existingRows[0].id;
    const existingBusinessId = existingRows[0].business_id;

    await connection.query(
      `
        UPDATE business_data
        SET
          business_rating = ?,
          business_review_count = ?
        WHERE id = ?
      `,
      [business_rating, business_review_count, existingId]
    );

    return {
      success: true,
      id: existingId,
      business_id: existingBusinessId,
      updated: true,
    };
  }

  // --------------------------------------------------
  // INSERT NEW ROW (first time only)
  // --------------------------------------------------
  const finalBusinessId = business_id?.trim() || `BIZ-${ulid()}`;

  const [insertResult] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO business_data (
        business_id,
        project_idx,
        business_rating,
        business_review_count
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      finalBusinessId,
      project_idx,
      business_rating,
      business_review_count,
    ]
  );

  if (!insertResult.insertId) {
    throw new Error("Failed to insert business_data row");
  }

  return {
    success: true,
    id: insertResult.insertId,
    business_id: finalBusinessId,
    created: true,
  };
};

export const deleteBusinessDataFunction = async (
  connection: PoolConnection,
  project_idx: number,
  business_id: string
): Promise<{ success: true }> => {
  const q = `
    DELETE FROM business_data
    WHERE business_id = ? AND project_idx = ?
  `;

  await connection.query(q, [business_id, project_idx]);

  return { success: true };
};