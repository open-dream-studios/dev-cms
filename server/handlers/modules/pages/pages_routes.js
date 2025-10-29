// server/handlers/modules/pages/pages_routes.js
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

const router = express.Router();

// ---- PAGES ----
router.post(
  "/get",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getPages)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(upsertPage)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(deletePage)
);

router.post(
  "/reorder",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(reorderPages)
);

// ---- PAGE DEFINITIONS ----
router.post(
  "/page-definitions/get-all",
  authenticateUser,
  errorHandler(getPageDefinitions)
);
router.post(
  "/page-definitions/upsert",
  authenticateUser,
  requireAdmin,
  transactionHandler(upsertPageDefinition)
);
router.post(
  "/page-definitions/delete",
  authenticateUser,
  requireAdmin,
  transactionHandler(deletePageDefinition)
);

// ---- PAGES DATA EXPORT ----
router.post("/get-data", transactionHandler(getPageData));

export default router;
