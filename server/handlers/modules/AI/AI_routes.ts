// server/handlers/modules/AI/AI_routes.ts
import express from "express";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";
import { fetchAICompletion } from "./AI_controllers.js";

const router = express.Router();

// ---- AI ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(fetchAICompletion)
);

export default router;
