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
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- MEDIA ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getMedia)
);
router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertMedia)
);
router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteMedia)
);
router.post(
  "/rotate",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(rotateMedia)
);

// ---- MEDIA FOLDERS ----
router.post(
  "/folders",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getMediaFolders)
);
router.post(
  "/folders/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertMediaFolders)
);
router.post(
  "/folders/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteMediaFolder)
);

// ---- MEDIA LINKS ----
router.post(
  "/media-links",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getMediaLinks)
);
router.post(
  "/media-links/update",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertMediaLinks)
);
router.post(
  "/media-links/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteMediaLinks)
);

// ---- IMAGES ----
router.post(
  "/upload",
  upload.array("files"),
  verifyVercelProxy,
  transactionHandler(uploadMedia)
);

export default router;
