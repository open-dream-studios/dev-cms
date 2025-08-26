// server/routes/modules.js
import express from "express";
import {
  addProjectModule,
  deleteProjectModule,
  getProjectModules,
  getAllModules,
  upsertModule,
  deleteModule,
} from "../controllers/modules.js";
import { authenticateUser } from "../util/auth.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

// project-specific modules
router.post(
  "/add",
  authenticateUser,
  checkProjectPermission(3), // owner+
  addProjectModule
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // owner+
  deleteProjectModule
);

router.post(
  "/get",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getProjectModules
);

// global modules (registry)
router.post("/get-all", authenticateUser, getAllModules);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(4), // admin only
  upsertModule
);

router.post(
  "/delete-module",
  authenticateUser,
  checkProjectPermission(4), // admin only
  deleteModule
);

export default router;