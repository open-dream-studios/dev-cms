// server/routes/sections.js
import express from "express";
import {
  getAllSectionDefinitions,
  upsertSectionDefinition,
  deleteSectionDefinition,
  addSection,
  deleteSection,
  getSections,
  reorderSections,
} from "../controllers/sections.js";
import { authenticateUser } from "../util/auth.js";
import { requireAdmin } from "../util/roles.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

// SECTION DEFINITIONS
router.post(
  "/section-definitions/get-all",
  authenticateUser,
  getAllSectionDefinitions
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


// SECTIONS
router.post(
  "/add",
  authenticateUser,
  checkProjectPermission(3),
  addSection
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

export default router;