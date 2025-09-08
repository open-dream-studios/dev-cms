import express from "express";
import {
  getProjectMediaLinks,
  upsertMediaLinks,
  deleteMediaLinks,
  reorderMediaLinks,
} from "../controllers/mediaLinks.js";
import { authenticateUser } from "../connection/middlewares.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

router.get(
  "/",
  authenticateUser,
  checkProjectPermission(1),
  getProjectMediaLinks
);
router.post(
  "/update",
  authenticateUser,
  checkProjectPermission(2),
  upsertMediaLinks
);
router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(2),
  deleteMediaLinks
);
router.post(
  "/reorder",
  authenticateUser,
  checkProjectPermission(2),
  reorderMediaLinks
);

export default router;
