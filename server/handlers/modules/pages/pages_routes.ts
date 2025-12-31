// server/handlers/modules/pages/pages_routes.ts
import express from "express";
import {
  upsertPageDefinition,
  deletePageDefinition,
  getPageData,
  getPages,
  deletePage,
  upsertPage,
  getPageDefinitions,
  reorderPages,
} from "./pages_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { requireAdmin } from "../../../util/roles.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- PAGES ----
router.post(
  "/get",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getPages)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(upsertPage)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(deletePage)
);

router.post(
  "/reorder",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(reorderPages)
);

// ---- PAGE DEFINITIONS ----
router.post(
  "/page-definitions/get-all",
  verifyVercelProxy,
  authenticateUser,
  errorHandler(getPageDefinitions)
);
router.post(
  "/page-definitions/upsert",
  verifyVercelProxy,
  authenticateUser,
  requireAdmin,
  transactionHandler(upsertPageDefinition)
);
router.post(
  "/page-definitions/delete",
  verifyVercelProxy,
  authenticateUser,
  requireAdmin,
  transactionHandler(deletePageDefinition)
);

// ---- PAGES DATA EXPORT ----
router.post("/get-data", transactionHandler(getPageData));

export default router;
