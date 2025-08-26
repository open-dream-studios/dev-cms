// server/routes/integrations.js
import express from "express";
import {
  getIntegrations,
  addOrUpdateIntegration,
  deleteIntegrationKey,
} from "../controllers/integrations.js";
import { authenticateUser } from "../connection/middlewares.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

// viewer+ can view integrations
router.get(
  "/",
  authenticateUser,
  checkProjectPermission(1),
  getIntegrations
);

// editor+ can add or update integrations
router.post(
  "/update",
  authenticateUser,
  checkProjectPermission(2),
  addOrUpdateIntegration
);

// editor+ can delete keys from integration
router.post(
  "/key",
  authenticateUser,
  checkProjectPermission(2),
  deleteIntegrationKey
);

export default router;