// server/routes/media.js
import express from "express";
import {
  getMedia,
  addMedia,
  deleteMedia,
  getFolders,
  addFolder,
  deleteFolder,
  reorderMedia
} from "../controllers/media.js";
import { authenticateUser } from "../connection/middlewares.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

// media
router.get("/", authenticateUser, checkProjectPermission(2), getMedia);
router.post("/add", authenticateUser, checkProjectPermission(3), addMedia);
router.post("/delete", authenticateUser, checkProjectPermission(3), deleteMedia);
router.post("/reorder", authenticateUser, checkProjectPermission(3), reorderMedia);

// folders
router.get("/folders", authenticateUser, checkProjectPermission(2), getFolders);
router.post("/folders/add", authenticateUser, checkProjectPermission(3), addFolder);
router.post("/folders/delete", authenticateUser, checkProjectPermission(3), deleteFolder);

export default router;