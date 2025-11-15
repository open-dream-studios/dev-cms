// server/handlers/modules/modules/modules_routes.ts
import express from "express";
import {
  getModules,
  upsertModule,
  deleteModule,
  runModule,
  getModuleDefinitionTree
} from "./modules_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
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
  checkProjectPermission(8), // owner+
  transactionHandler(upsertModule)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(deleteModule)
);

router.post(
  "/run/:identifier",
  authenticateUser,
  checkProjectPermission(8), // owner
  transactionHandler(runModule)
);

router.post(
  "/definitions",
  authenticateUser,
  errorHandler(getModuleDefinitionTree)
);

export default router;
