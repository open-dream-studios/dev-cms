// server/handlers/public/messages/messages_routes.ts
import express from "express";
import {
  getConversations,
  getMessagesByConversation,
  upsertMessage,
  deleteMessage,
} from "./messages_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

router.post(
  "/conversations",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(getConversations)
);

router.post(
  "/by-conversation",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(getMessagesByConversation)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(upsertMessage)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(deleteMessage)
);

export default router;