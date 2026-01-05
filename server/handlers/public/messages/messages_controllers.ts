// server/handlers/public/messages/messages_controllers.ts
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import {
  getConversationsFunction,
  getMessagesByConversationFunction,
  upsertMessageFunction,
  deleteMessageFunction,
} from "./messages_repositories.js";
import { getProjectFromRequest } from "../../../util/verifyProxy.js";

export const getConversations = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = await getProjectFromRequest(req, connection);
  const user_id = req.user?.user_id;
  if (!project_idx || !user_id) throw new Error("Missing auth");

  const conversations = await getConversationsFunction(
    connection,
    project_idx,
    user_id
  );

  return { success: true, conversations };
};

export const getMessagesByConversation = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = await getProjectFromRequest(req, connection);
  const user_id = req.user?.user_id;
  const { conversation_id, cursor, limit = 10 } = req.body;

  if (!project_idx || !user_id || !conversation_id)
    throw new Error("Missing required fields");

  return await getMessagesByConversationFunction(
    connection,
    project_idx,
    conversation_id,
    cursor,
    limit
  );
};

export const upsertMessage = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = await getProjectFromRequest(req, connection);
  const user_id = req.user?.user_id;
  if (!project_idx || !user_id) throw new Error("Missing auth");

  return await upsertMessageFunction(
    connection,
    project_idx,
    user_id,
    req.body
  );
};

export const deleteMessage = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { message_id } = req.body;
  const project_idx = await getProjectFromRequest(req, connection);
  const user_id = req.user?.user_id;

  if (!project_idx || !message_id || !user_id)
    throw new Error("Missing required fields");

  return await deleteMessageFunction(
    connection,
    project_idx,
    message_id,
    user_id
  );
};