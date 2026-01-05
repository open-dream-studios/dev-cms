// server/handlers/public/messages/messages_repositories.ts
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { ulid } from "ulid";

export const getConversationsFunction = async (
  connection: PoolConnection,
  project_idx: number,
  user_id: string
) => {
  const q = `
    SELECT
      c.conversation_id,
      c.project_idx,
      c.title,
      m.message_text AS last_message,
      m.created_at AS last_message_at
    FROM conversations c
    JOIN conversation_participants p
      ON p.conversation_id = c.conversation_id
    LEFT JOIN conversation_messages m
      ON m.id = (
        SELECT id
        FROM conversation_messages
        WHERE conversation_id = c.conversation_id
        ORDER BY created_at DESC
        LIMIT 1
      )
    WHERE p.user_id = ?
      AND c.project_idx = ?
    ORDER BY m.created_at DESC;
  `;

  const [rows] = await connection.query<RowDataPacket[]>(q, [
    user_id,
    project_idx,
  ]);

  return rows;
};

/* -------------------------------
   PAGINATED MESSAGES
-------------------------------- */

export const getMessagesByConversationFunction = async (
  connection: PoolConnection,
  project_idx: number,
  conversation_id: string,
  cursor: string | null,
  limit: number
) => {
  const q = `
    SELECT *
    FROM conversation_messages
    WHERE conversation_id = ?
      AND project_idx = ?
      ${cursor ? "AND created_at < ?" : ""}
    ORDER BY created_at DESC
    LIMIT ?
  `;

  const params = cursor
    ? [conversation_id, project_idx, cursor, limit + 1]
    : [conversation_id, project_idx, limit + 1];

  const [rows] = await connection.query<RowDataPacket[]>(q, params);

  const hasMore = rows.length > limit;
  const messages = hasMore ? rows.slice(0, limit) : rows;

  return {
    messages: messages.reverse(),
    nextCursor: hasMore
      ? messages[0].created_at
      : null,
  };
};

/* -------------------------------
   UPSERT MESSAGE
-------------------------------- */

export const upsertMessageFunction = async (
  connection: PoolConnection,
  project_idx: number,
  user_id: string,
  reqBody: any
) => {
  const { conversation_id, user_to = null, message_text } = reqBody;

  if (!conversation_id || !message_text?.trim())
    throw new Error("Invalid message");

  const message_id = `MSG-${ulid()}`;

  await connection.query(
    `
    INSERT INTO conversation_messages (
      message_id,
      conversation_id,
      project_idx,
      user_from,
      user_to,
      message_text
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      message_id,
      conversation_id,
      project_idx,
      user_id,
      user_to,
      message_text,
    ]
  );

  return { success: true, message_id };
};

/* -------------------------------
   DELETE
-------------------------------- */

export const deleteMessageFunction = async (
  connection: PoolConnection,
  project_idx: number,
  message_id: string,
  user_id: string
) => {
  await connection.query(
    `
    DELETE FROM conversation_messages
    WHERE message_id = ?
      AND project_idx = ?
      AND user_from = ?
  `,
    [message_id, project_idx, user_id]
  );

  return { success: true };
};