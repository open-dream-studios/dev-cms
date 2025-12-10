// server/handlers/modules/calls/calls_repositories.js
import { ProjectCall } from "@open-dream/shared";
import { db } from "../../../connection/connect.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";

// ---------- CALL FUNCTIONS ----------
export const getCallsByProjectFunction = async (
  project_idx: number
): Promise<ProjectCall[]> => {
  const q = `
    SELECT *
    FROM calls
    WHERE project_idx = ?
    ORDER BY started_at DESC
  `;
  const [rows] = await db
    .promise()
    .query<(ProjectCall & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertCallFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const {
    project_idx,
    call_id,
    aircall_call_id,
    call_uuid,
    direction,
    from_number,
    to_number,
    started_at,
    ended_at,
    duration,
    status,
    agent_id,
    agent_name,
    agent_email,
    hangup_cause,
    recording_url,
    transcription,
    aircall_direct_link,
  } = reqBody;

  const finalCallId =
    call_id && call_id.trim() !== ""
      ? call_id
      : "CALL-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

  const query = `
    INSERT INTO calls (
      project_idx,
      call_id,
      aircall_call_id,
      call_uuid,
      direction,
      from_number,
      to_number,
      started_at,
      ended_at,
      duration,
      status,
      agent_id,
      agent_name,
      agent_email,
      hangup_cause,
      recording_url,
      transcription,
      aircall_direct_link
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      aircall_call_id = VALUES(aircall_call_id),
      call_uuid = VALUES(call_uuid),
      direction = VALUES(direction),
      from_number = VALUES(from_number),
      to_number = VALUES(to_number),
      started_at = VALUES(started_at),
      ended_at = VALUES(ended_at),
      duration = VALUES(duration),
      status = VALUES(status),
      agent_id = VALUES(agent_id),
      agent_name = VALUES(agent_name),
      agent_email = VALUES(agent_email),
      hangup_cause = VALUES(hangup_cause),
      recording_url = VALUES(recording_url),
      transcription = VALUES(transcription),
      aircall_direct_link = VALUES(aircall_direct_link)
  `;

  const values = [
    project_idx,
    finalCallId,
    aircall_call_id,
    call_uuid || null,
    direction || null,
    from_number || null,
    to_number || null,
    started_at || null,
    ended_at || null,
    duration || null,
    status || null,
    agent_id || null,
    agent_name || null,
    agent_email || null,
    hangup_cause || null,
    recording_url || null,
    transcription ? JSON.stringify(transcription) : null,
    aircall_direct_link || null,
  ];

  const [result] = await connection.query<ResultSetHeader>(query, values);

  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT * FROM calls WHERE call_id = ?",
    [finalCallId]
  );
  if (!rows.length) throw new Error("Call not found after upsert");
  return { success: true, call: rows[0] };
};

// Delete a call by call_id
export const deleteCallFunction = async (
  connection: PoolConnection,
  call_id: string
) => {
  const q = `DELETE FROM calls WHERE call_id = ?`;
  await connection.query(q, [call_id]);
  return { success: true };
};
