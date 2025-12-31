// server/handlers/modules/pages/sections_routes.ts
import express from "express";
import {
  getSections,
  upsertSection,
  deleteSection,
  reorderSections,
  getSectionDefinitions,
  upsertSectionDefinition,
  deleteSectionDefinition,
} from "./sections_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { requireAdmin } from "../../../util/roles.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- SECTIONS ----
router.post(
  "/get",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getSections)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8),
  transactionHandler(upsertSection)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8),
  transactionHandler(deleteSection)
);

router.post(
  "/reorder",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(reorderSections)
);

// ---- SECTION DEFINITIONS ----
router.post(
  "/section-definitions/get-all",
  verifyVercelProxy,
  authenticateUser,
  errorHandler(getSectionDefinitions)
);

router.post(
  "/section-definitions/upsert",
  verifyVercelProxy,
  authenticateUser,
  requireAdmin,
  transactionHandler(upsertSectionDefinition)
);

router.post(
  "/section-definitions/delete",
  verifyVercelProxy,
  authenticateUser,
  requireAdmin,
  transactionHandler(deleteSectionDefinition)
);

export default router;
