import express from "express";
import {
  getFactDefinitions,
  upsertFactDefinition,
  deleteFactDefinition,
} from "./fact_definitions_controllers.js";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../util/verifyProxy.js";
import {
  getFactFolders,
  upsertFactFolders,
  deleteFactFolder,
} from "./fact_definition_folder_controllers.js";

const router = express.Router();

// viewer+
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  errorHandler(getFactDefinitions)
);

// editor+
router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertFactDefinition)
);

// editor+
router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteFactDefinition)
);

// ---- FACT FOLDERS ----
router.post(
  "/folders",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getFactFolders)
);

router.post(
  "/folders/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertFactFolders)
);

router.post(
  "/folders/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteFactFolder)
);

export default router;
