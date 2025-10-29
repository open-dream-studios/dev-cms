// server/handlers/modules/products/products_routes.js
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

const router = express.Router();

router.get(
  "/",
  authenticateUser,
  checkProjectPermission(1),
  errorHandler(getProducts)
);
router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(upsertProducts)
);
router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(deleteProducts)
);

export default router;
