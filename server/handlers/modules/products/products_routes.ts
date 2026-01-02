// server/handlers/modules/products/products_routes.ts
import express from "express";
import {
  getProducts,
  upsertProducts,
  deleteProducts,
} from "./products_controllers.js";
import { authenticateUser } from "../../../connection/middlewares.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getProducts)
);
router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertProducts)
);
router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteProducts)
);

export default router;
