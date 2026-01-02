// server/handlers/integrations/integrations_routes.ts
import express from "express";
import {
  getIntegrations,
  upsertIntegration,
  deleteIntegration,
} from "./integrations_controllers.js";
import { authenticateUser } from "../../connection/middlewares.js";
import { checkProjectPermission } from "../../util/permissions.js";
import { requireAdmin } from "../../util/roles.js";
import {
  errorHandler,
  transactionHandler,
} from "../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../util/verifyProxy.js";

const router = express.Router();

// ---- INTEGRATIONS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  errorHandler(getIntegrations)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  requireAdmin, // admin
  transactionHandler(upsertIntegration)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  requireAdmin, // admin
  transactionHandler(deleteIntegration)
);

export default router;
