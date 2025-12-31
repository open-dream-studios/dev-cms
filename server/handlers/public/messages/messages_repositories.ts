// server/handlers/public/messages/messages_repositories.ts
import { db } from "../../../connection/connect.js";
import type { Message } from "@open-dream/shared";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";

// ---------- MESSAGE FUNCTIONS ----------
export const getMessagesFunction = async (
  project_idx: number,
  user_id: string
): Promise<Message[]> => {
  const q = `
    SELECT *
    FROM messages
    WHERE project_idx = ?
      AND (user_from = ? OR user_to = ?)
    ORDER BY created_at ASC
  `;

  const [rows] = await db
    .promise()
    .query<(Message & RowDataPacket)[]>(q, [project_idx, user_id, user_id]);

  return rows;
};

export const upsertMessageFunction = async (
  connection: PoolConnection,
  project_idx: number,
  user_id: string,
  reqBody: any
) => {
  const { message_id, user_to, message_text } = reqBody;

  if (!message_text) return { success: false, message: "No text provided" };

  const finalMessageId = message_id?.trim() || `MSG-${ulid()}`;

  const q = `
    SELECT 1 FROM users
    WHERE user_id = ? AND project_idx = ?
    INSERT INTO messages (
      message_id,
      project_idx,
      user_from,
      user_to,
      message_text
    )
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      message_text = IF(user_from = VALUES(user_from), VALUES(message_text), message_text),
      updated_at = IF(user_from = VALUES(user_from), NOW(), updated_at)
  `;

  const values = [
    user_to,
    project_idx,
    finalMessageId,
    project_idx,
    user_id,
    user_to,
    message_text,
    user_id,
  ];

  const [result] = await connection.query<ResultSetHeader>(q, values);

  if (message_id && result.affectedRows === 0) {
    throw new Error("Not authorized to update message");
  }

  return {
    success: true,
    message_id: finalMessageId,
    inserted: result.insertId && result.insertId > 0,
  };
};

export const deleteMessageFunction = async (
  connection: PoolConnection,
  project_idx: number,
  message_id: string,
  user_id: string
): Promise<{ success: true }> => {
  const q = `
    DELETE FROM messages
    WHERE message_id = ?
      AND project_idx = ?
      AND user_from = ?
  `;

  await connection.query(q, [message_id, project_idx, user_id]);
  return { success: true };
};
