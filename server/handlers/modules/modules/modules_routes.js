// server/handlers/modules/modules/modules_routes.js
import express from "express";
import {
  getModules,
  upsertModule,
  deleteModule,
  getModuleDefinitions,
  upsertModuleDefinition,
  deleteModuleDefinition,
  runModule,
} from "./modules_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { requireAdmin } from "../../../util/roles.js";

const router = express.Router();

// ---- MODULES ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getModules
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3), // owner+
  upsertModule
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // owner+
  deleteModule
);

// ---- MODULE DEFINITIONS ----
router.post(
  "/definitions",
  authenticateUser,
  getModuleDefinitions
);
router.post(
  "/definitions/upsert",
  authenticateUser,
  requireAdmin, // admin
  upsertModuleDefinition
);
router.post(
  "/definitions/delete",
  authenticateUser,
  requireAdmin, // admin
  deleteModuleDefinition
);

router.post(
  "/run/:identifier",
  authenticateUser,
  checkProjectPermission(3), // owner
  runModule
);

export default router;
