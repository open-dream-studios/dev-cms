// server/handlers/public/scheduleRequests/scheduleRequests_repositories.ts
import { normalizeToMySQLDatetime } from "../../../functions/time.js";
import { db } from "../../../connection/connect.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";

// ---------- GET ----------
export const getScheduleRequestsFunction = async (project_idx: number) => {
  const q = `
    SELECT *
    FROM schedule_requests
    WHERE project_idx = ?
    ORDER BY created_at DESC
  `;

  const [rows] = await db.promise().query<RowDataPacket[]>(q, [project_idx]);

  return rows;
};

// ---------- UPSERT ----------
export const upsertScheduleRequestFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any,
  user_id: string | null
) => {
  const {
    schedule_request_id,
    customer_id,
    job_id,
    source_type,
    assign_source_user_id,
    request_type,
    calendar_event_id,
    proposed_start,
    proposed_end,
    proposed_location,
    status,
    ai_reasoning,
    event_title,
    event_description,
    metadata,
  } = reqBody;

  if (!source_type || !request_type) {
    throw new Error("source_type and request_type are required");
  }

  let finalSourceType = source_type;
  if (!user_id) {
    finalSourceType = "public";
  }

  const source_user_id = assign_source_user_id ? user_id : null;

  const finalScheduleRequestId =
    schedule_request_id?.trim() || `SREQ-${ulid()}`;

  const normalizedMetadata =
    metadata == null
      ? null
      : typeof metadata === "string"
      ? metadata
      : JSON.stringify(metadata);

  const query = `
    INSERT INTO schedule_requests (
      schedule_request_id,
      project_idx,
      customer_id,
      job_id,
      source_type,
      source_user_id,
      request_type,
      calendar_event_id,
      proposed_start,
      proposed_end,
      proposed_location,
      status,
      ai_reasoning,
      event_title,
      event_description,
      metadata
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      customer_id = VALUES(customer_id),
      job_id = VALUES(job_id),
      source_type = VALUES(source_type),
      source_user_id = VALUES(source_user_id),
      request_type = VALUES(request_type),
      calendar_event_id = VALUES(calendar_event_id),
      proposed_start = VALUES(proposed_start),
      proposed_end = VALUES(proposed_end),
      proposed_location = VALUES(proposed_location),
      status = VALUES(status),
      ai_reasoning = VALUES(ai_reasoning),
      event_title = VALUES(event_title),
      event_description = VALUES(event_description),
      metadata = VALUES(metadata),
      updated_at = NOW(),
      resolved_at = IF(
        VALUES(status) IN ('approved','rejected'),
        NOW(),
        resolved_at
      )
  `;

  const values = [
    finalScheduleRequestId,
    project_idx,
    customer_id ?? null,
    job_id ?? null,
    finalSourceType,
    source_user_id ?? null,
    request_type,
    calendar_event_id ?? null,
    normalizeToMySQLDatetime(proposed_start),
    normalizeToMySQLDatetime(proposed_end),
    proposed_location ?? null,
    status ?? "pending",
    ai_reasoning ?? null,
    event_title,
    event_description,
    normalizedMetadata,
  ];

  const [result] = await connection.query<ResultSetHeader>(query, values);

  const inserted = result.insertId && result.insertId > 0;

  let internalId = inserted ? result.insertId : null;

  if (!inserted) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `
        SELECT id
        FROM schedule_requests
        WHERE schedule_request_id = ?
          AND project_idx = ?
      `,
      [finalScheduleRequestId, project_idx]
    );
    if (rows.length) internalId = rows[0].id;
  }

  if (!internalId) {
    console.error("ERROR READING INTERNAL ID:", result);
    throw new Error("Could not determine internal ID after upsert");
  }

  return {
    success: true,
    id: internalId,
    schedule_request_id: finalScheduleRequestId,
  };
};

// ---------- DELETE ----------
export const deleteScheduleRequestFunction = async (
  connection: PoolConnection,
  project_idx: number,
  schedule_request_id: string
): Promise<{ success: true }> => {
  const q = `
    DELETE FROM schedule_requests
    WHERE schedule_request_id = ?
      AND project_idx = ?
  `;
  await connection.query(q, [schedule_request_id, project_idx]);
  return { success: true };
};
