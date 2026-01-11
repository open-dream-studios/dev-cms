// server/handlers/modules/leads/leads_repositories.ts
import { db } from "../../../connection/connect.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";

// ---------- LEAD FUNCTIONS ----------

export const getLeadsFunction = async (
  project_idx: number
) => {
  const q = `
    SELECT l.*
    FROM leads l
    JOIN customers c ON c.customer_id = l.customer_id
    WHERE c.project_idx = ?
    ORDER BY l.created_at DESC
  `;

  const [rows] = await db
    .promise()
    .query<RowDataPacket[]>(q, [project_idx]);

  return rows;
};

export const upsertLeadFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    lead_id,
    customer_id,
    lead_type,
    product_id,
    job_definition_id,
    status,
    notes,
    source,
  } = reqBody;

  if (!customer_id || !lead_type) {
    throw new Error("Missing required lead fields");
  }

  // ---- ENFORCE LEAD RULES ----
  // if (lead_type === "product" && !product_id) {
  //   throw new Error("Product leads require product_id");
  // }

  // if (
  //   lead_type === "service" &&
  //   !product_id &&
  //   !job_definition_id
  // ) {
  //   throw new Error(
  //     "Service leads require product_id or job_definition_id"
  //   );
  // }

  const finalLeadId =
    typeof lead_id === "string" && lead_id.trim()
      ? lead_id.trim()
      : `LEAD-${ulid()}`;

  const query = `
    INSERT INTO leads (
      lead_id,
      project_idx,
      customer_id,
      lead_type,
      product_id,
      job_definition_id,
      status,
      notes,
      source
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      customer_id = VALUES(customer_id),
      lead_type = VALUES(lead_type),
      product_id = VALUES(product_id),
      job_definition_id = VALUES(job_definition_id),
      status = VALUES(status),
      notes = VALUES(notes),
      source = VALUES(source),
      updated_at = NOW()
  `;

  const values = [
    finalLeadId,
    project_idx,
    customer_id,
    lead_type,
    product_id || null,
    job_definition_id || null,
    status || "new",
    notes,
    source,
  ];

  const [result] = await connection.query<ResultSetHeader>(query, values);

  const inserted = result.insertId && result.insertId > 0;
  let internalId = inserted ? result.insertId : null;

  if (!inserted) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `
        SELECT id
        FROM leads
        WHERE lead_id = ? AND project_idx = ?
      `,
      [finalLeadId, project_idx]
    );
    if (rows.length) internalId = rows[0].id;
  }

  if (!internalId) {
    console.error("ERROR READING INTERNAL LEAD ID:", result);
    throw new Error("Could not determine internal lead ID after upsert");
  }

  return { success: true, id: internalId, lead_id: finalLeadId };
};

export const deleteLeadFunction = async (
  connection: PoolConnection,
  project_idx: number,
  lead_id: string
): Promise<{ success: true }> => {
  const q = `
    DELETE l
    FROM leads l
    JOIN customers c ON c.customer_id = l.customer_id
    WHERE l.lead_id = ? AND c.project_idx = ?
  `;
  await connection.query(q, [lead_id, project_idx]);
  return { success: true };
};