// server/handlers/modules/modules/modules_routes.ts
import express from "express";
import {
  getModules,
  upsertModule,
  deleteModule,
  runModule,
  getModuleDefinitionTree,
} from "./modules_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- MODULES ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getModules)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(upsertModule)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(deleteModule)
);

router.post(
  "/run/:identifier",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner
  transactionHandler(runModule)
);

router.post(
  "/definitions",
  verifyVercelProxy,
  authenticateUser,
  errorHandler(getModuleDefinitionTree)
);

export default router;
