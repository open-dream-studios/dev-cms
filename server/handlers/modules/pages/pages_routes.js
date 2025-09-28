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

const router = express.Router();

// ---- PAGES ----
router.post(
  "/get",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getPages
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3), // owner+
  upsertPage
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // owner+
  deletePage
);

router.post(
  "/reorder",
  authenticateUser,
  checkProjectPermission(3), // owner+
  reorderPages
);

// ---- PAGE DEFINITIONS ----
router.post("/page-definitions/get-all", authenticateUser, getPageDefinitions);
router.post(
  "/page-definitions/upsert",
  authenticateUser,
  requireAdmin,
  upsertPageDefinition
);
router.post(
  "/page-definitions/delete",
  authenticateUser,
  requireAdmin,
  deletePageDefinition
);

// ---- PAGES DATA EXPORT ----
router.post("/get-data", getPageData);

export default router;
