// server/handlers/public/messages/messages_controllers.ts
import {
  getMessagesFunction,
  upsertMessageFunction,
  deleteMessageFunction,
} from "./messages_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import type { Message } from "@open-dream/shared";
import { getProjectFromRequest } from "../../../util/verifyProxy.js";

// ---------- MESSAGE CONTROLLERS ----------
export const getMessages = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = await getProjectFromRequest(req, connection);
  const user_id = req.user?.user_id;
  if (!project_idx || !user_id) throw new Error("Missing required fields");
  const messages: Message[] = await getMessagesFunction(project_idx, user_id);
  return { success: true, messages };
};

export const upsertMessage = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = await getProjectFromRequest(req, connection);
  const user_id = req.user?.user_id;
  const { message_id, user_to, message_text } = req.body;

  if (typeof message_text !== "string") throw new Error("Invalid message_text");
  if (message_id && typeof message_id !== "string")
    throw new Error("Invalid message_id");

  if (!project_idx || !user_id) throw new Error("Missing required fields");

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
