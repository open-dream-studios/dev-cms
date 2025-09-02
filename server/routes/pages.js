// server/routes/pageDefinitions.js
import express from "express";
import {
  getAllPageDefinitions,
  upsertPageDefinition,
  deletePageDefinition,
  addProjectPage,
  deleteProjectPage,
  getProjectPages,
  reorderProjectPages,
  getPageData
} from "../controllers/pages.js";
import { authenticateUser } from "../util/auth.js";
import { requireAdmin } from "../util/roles.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

// DEFINITIONS
router.post(
  "/page-definitions/get-all",
  authenticateUser,
  getAllPageDefinitions
);
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

// PAGES
router.post(
  "/add",
  authenticateUser,
  checkProjectPermission(3), // owner+
  addProjectPage
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // owner+
  deleteProjectPage
);

router.post(
  "/get",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getProjectPages
);

router.post(
  "/reorder",
  authenticateUser,
  checkProjectPermission(3), // owner+
  reorderProjectPages
);

router.post(
  "/get-data",
  getPageData
);

export default router;
