import express from "express";
import {
  getFactDefinitions,
  upsertFactDefinition,
  deleteFactDefinition,
  reorderFactDefinitions,
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
  reorderFactFolders,
} from "./fact_definition_folder_controllers.js";
import { deleteEnumOptionController, getEnumOptions, reorderEnumOptionsController, upsertEnumOptionController } from "./fact_definition_enum_controllers.js";

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
  checkProjectPermission(2),
  transactionHandler(upsertFactDefinition)
);

// editor+
router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(deleteFactDefinition)
);

router.post(
  "/reorder",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),  
  transactionHandler(reorderFactDefinitions)
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


router.post(
  "/folders/reorder",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(reorderFactFolders)
);

router.post(
  "/enum-options",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  errorHandler(getEnumOptions)
);

router.post(
  "/enum-options/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertEnumOptionController)
);

router.post(
  "/enum-options/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteEnumOptionController)
);

router.post(
  "/enum-options/reorder",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(reorderEnumOptionsController)
);

export default router;
