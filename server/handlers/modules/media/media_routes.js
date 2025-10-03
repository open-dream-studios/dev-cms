// server/modules/mdeia/media_routes.js
import express from "express";
import {
  uploadImages,
  getMedia,
  upsertMedia,
  deleteMedia,
  reorderMedia,
  getMediaFolders,
  upsertMediaFolder,
  deleteMediaFolder,
  reorderMediaFolders,
  getMediaLinks,
  upsertMediaLinks,
  deleteMediaLinks,
  reorderMediaLinks,
} from "./media_controllers.js";
import { authenticateUser } from "../../../connection/middlewares.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import upload from "../../../services/middleware.js";

const router = express.Router();

// ---- MEDIA ----
router.get("/", authenticateUser, checkProjectPermission(1), getMedia);
router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(2),
  upsertMedia
);
router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(2),
  deleteMedia
);
router.post(
  "/reorder",
  authenticateUser,
  checkProjectPermission(2),
  reorderMedia
);

// ---- MEDIA FOLDERS ----
router.get(
  "/folders",
  authenticateUser,
  checkProjectPermission(1),
  getMediaFolders
);
router.post(
  "/folders/upsert",
  authenticateUser,
  checkProjectPermission(2),
  upsertMediaFolder
);
router.post(
  "/folders/delete",
  authenticateUser,
  checkProjectPermission(2),
  deleteMediaFolder
);
router.post(
  "/folders/reorder",
  authenticateUser,
  checkProjectPermission(2),
  reorderMediaFolders
);

// ---- MEDIA LINKS ----
router.get(
  "/media-links",
  authenticateUser,
  checkProjectPermission(1),
  getMediaLinks
);
router.post(
  "/media-links/update",
  authenticateUser,
  checkProjectPermission(2),
  upsertMediaLinks
);
router.post(
  "/media-links/delete",
  authenticateUser,
  checkProjectPermission(2),
  deleteMediaLinks
);
router.post(
  "/media-links/reorder",
  authenticateUser,
  checkProjectPermission(2),
  reorderMediaLinks
);

// ---- IMAGES ----
router.post("/compress", upload.array("files"), uploadImages);

export default router;
