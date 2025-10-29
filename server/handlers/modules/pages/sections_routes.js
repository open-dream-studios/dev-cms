// server/handlers/modules/pages/sections_routes.js
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
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";

const router = express.Router();

// ---- SECTIONS ----
router.post(
  "/get",
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getSections)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertSection)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteSection)
);

router.post(
  "/reorder",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(reorderSections)
);

// ---- SECTION DEFINITIONS ----
router.post(
  "/section-definitions/get-all",
  authenticateUser,
  errorHandler(getSectionDefinitions)
);

router.post(
  "/section-definitions/upsert",
  authenticateUser,
  requireAdmin,
  transactionHandler(upsertSectionDefinition)
);

router.post(
  "/section-definitions/delete",
  authenticateUser,
  requireAdmin,
  transactionHandler(deleteSectionDefinition)
);

export default router;