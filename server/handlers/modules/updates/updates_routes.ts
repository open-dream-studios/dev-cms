// server/handlers/modules/updates/updates_routes.ts
import express from "express";
import {
  getUpdates,
  upsertUpdate,
  deleteUpdate,
  toggleComplete,
  addRequest,
} from "./updates_controllers.js";

import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";

const router = express.Router();

// GET LIST
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getUpdates)
);

// UPSERT
router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(5), // editor+ (modify updates)
  transactionHandler(upsertUpdate)
);

// DELETE
router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(5), // editor+
  transactionHandler(deleteUpdate)
);

// TOGGLE COMPLETE
router.post(
  "/toggleComplete",
  authenticateUser,
  checkProjectPermission(5),
  transactionHandler(toggleComplete)
);

// ADD REQUEST (same as upsert but simplified)
router.post(
  "/requests/add",
  authenticateUser,
  checkProjectPermission(1), // viewer+ can request
  transactionHandler(addRequest)
);

export default router;