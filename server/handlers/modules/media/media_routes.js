// server/modules/mdeia/media_routes.js
import express from "express";
import {
  uploadImages,
  getMedia,
  upsertMedia,
  deleteMedia,
  getMediaFolders,
  upsertMediaFolders,
  deleteMediaFolder, 
  getMediaLinks,
  upsertMediaLinks,
  deleteMediaLinks, 
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
  upsertMediaFolders
);
router.post(
  "/folders/delete",
  authenticateUser,
  checkProjectPermission(2),
  deleteMediaFolder
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

// ---- IMAGES ----
router.post("/compress", upload.array("files"), uploadImages);

export default router;
