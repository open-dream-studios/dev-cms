// server/routes/modules.js
import express from "express";
import {
  addProjectModule,
  deleteProjectModule,
  getProjectModules,
  getAllModules,
  upsertModule,
  deleteModule,
  runModule,
} from "../controllers/modules.js";
import { authenticateUser } from "../util/auth.js";
import { checkProjectPermission } from "../util/permissions.js";
import { requireAdmin } from "../util/roles.js";

const router = express.Router();

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

router.post("/get-all", authenticateUser, getAllModules);
router.post("/upsert", authenticateUser, requireAdmin, upsertModule);
router.post("/delete-module", authenticateUser, requireAdmin, deleteModule);

router.post(
  "/run/:identifier",
  authenticateUser,
  checkProjectPermission(1),
  runModule
);

export default router;
