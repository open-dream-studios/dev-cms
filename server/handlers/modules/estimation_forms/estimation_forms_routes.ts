// server/handlers/modules/estimation_forms/estimation_forms_routes.ts
import express from "express";
import {
  deleteFormDefinition,
  getFormDefinition,
  getFormDefinitions,
  updateFormDefinitionStatus,
  upsertFormDefinition,
} from "./estimation_forms_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- ESTIMATION FORMS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // viewer+
  errorHandler(getFormDefinitions)
);

router.post(
  "/get",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // viewer+
  errorHandler(getFormDefinition)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(upsertFormDefinition)
);

router.post(
  "/status",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(updateFormDefinitionStatus)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(deleteFormDefinition)
);

export default router;
