// server/handlers/modules/folders/folder_routes.ts

import express from "express";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";
import {
  getFolders,
  upsertFolders,
  deleteFolder, 
  moveFolder
} from "./folders_controllers.js";

const router = express.Router();

// viewer+
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getFolders)
);

// editor+
router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertFolders)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteFolder)
);

router.post(
  "/move",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(moveFolder)
);


export default router;