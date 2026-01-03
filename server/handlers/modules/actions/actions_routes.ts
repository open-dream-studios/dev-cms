// server/handlers/modules/actions/actions_routes.ts
import express from "express";
import {
  upsertAction,
  deleteAction,
  getActions,
  getActionDefinitions,
  upsertActionDefinition,
  deleteActionDefinition,
} from "./actions_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- ACTIONS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getActions)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(upsertAction)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(deleteAction)
);

// ---- ACTION DEFINITIONS ----
router.post(
  "/definitions/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getActionDefinitions)
);

router.post(
  "/definitions/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(upsertActionDefinition)
);

router.post(
  "/definitions/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(deleteActionDefinition)
);

export default router;
