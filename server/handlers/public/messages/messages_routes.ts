// server/handlers/public/messages/messages_routes.ts
import express from "express";
import {
  getMessages,
  upsertMessage,
  deleteMessage,
} from "./messages_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- MESSAGES ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(getMessages)
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
