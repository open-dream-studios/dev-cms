// server/handlers/modules/products/products_routes.js
import express from "express";
import {
  getProducts,
  upsertProducts,
  deleteProducts
} from "./products_controllers.js";
import { authenticateUser } from "../../../connection/middlewares.js";
import { checkProjectPermission } from "../../../util/permissions.js";

const router = express.Router();

router.get("/", authenticateUser, checkProjectPermission(1), getProducts);
router.post("/upsert", authenticateUser, checkProjectPermission(2), upsertProducts);
router.post("/delete", authenticateUser, checkProjectPermission(2), deleteProducts);

export default router;