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
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";

const router = express.Router();

// ---- MODULES ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getModules)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(upsertModule)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(deleteModule)
);

// ---- MODULE DEFINITIONS ----
router.post(
  "/definitions",
  authenticateUser,
  errorHandler(getModuleDefinitions)
);
router.post(
  "/definitions/upsert",
  authenticateUser,
  requireAdmin, // admin
  transactionHandler(upsertModuleDefinition)
);
router.post(
  "/definitions/delete",
  authenticateUser,
  requireAdmin, // admin
  transactionHandler(deleteModuleDefinition)
);

router.post(
  "/run/:identifier",
  authenticateUser,
  checkProjectPermission(3), // owner
  transactionHandler(runModule)
);

export default router;
