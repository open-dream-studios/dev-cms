// server/routes/integrations.js
import express from "express";
import {
  getIntegrations,
  addOrUpdateIntegration,
  deleteIntegrationKey,
} from "../controllers/integrations.js";
import { authenticateUser } from "../connection/middlewares.js";
import { checkProjectPermission } from "../util/permissions.js";
import { requireAdmin } from "../util/roles.js";

const router = express.Router();

// viewer+ can view integrations
router.get(
  "/",
  authenticateUser,
  checkProjectPermission(3),
  getIntegrations
);

// editor+ can add or update integrations
router.post(
  "/update",
  authenticateUser,
  requireAdmin,
  addOrUpdateIntegration
);

// editor+ can delete keys from integration
router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(2),
  deleteIntegrationKey
);

export default router;