// server/modules/mdeia/media_routes.ts
import express from "express";
import {
  uploadMedia,
  getMedia,
  upsertMedia,
  deleteMedia,
  rotateMedia,
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
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";

const router = express.Router();

// ---- MEDIA ----
router.get(
  "/",
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getMedia)
);
router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertMedia)
);
router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteMedia)
);
router.post(
  "/rotate",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(rotateMedia)
);

// ---- MEDIA FOLDERS ----
router.get(
  "/folders",
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getMediaFolders)
);
router.post(
  "/folders/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertMediaFolders)
);
router.post(
  "/folders/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteMediaFolder)
);

// ---- MEDIA LINKS ----
router.get(
  "/media-links",
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getMediaLinks)
);
router.post(
  "/media-links/update",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertMediaLinks)
);
router.post(
  "/media-links/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteMediaLinks)
);

// ---- IMAGES ----
router.post("/upload", upload.array("files"), transactionHandler(uploadMedia));

export default router;
