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

const router = express.Router();

// ---- SECTIONS ----
router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3),
  upsertSection
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3),
  deleteSection
);

router.post(
  "/get",
  authenticateUser,
  checkProjectPermission(1),
  getSections
);

router.post(
  "/reorder",
  authenticateUser,
  checkProjectPermission(3),
  reorderSections
);

// ---- SECTION DEFINITIONS ----
router.post(
  "/section-definitions/get-all",
  authenticateUser,
  getSectionDefinitions
);

router.post(
  "/section-definitions/upsert",
  authenticateUser,
  requireAdmin,
  upsertSectionDefinition
);

router.post(
  "/section-definitions/delete",
  authenticateUser,
  requireAdmin,
  deleteSectionDefinition
);

export default router;