// server/routes/products.js
import express from "express";
import {
  getProducts,
  updateProducts,
  deleteProducts
} from "../controllers/products.js";
import { authenticateUser } from "../connection/middlewares.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

router.get("/", authenticateUser, checkProjectPermission(1), getProducts);
router.post("/update", authenticateUser, checkProjectPermission(2), updateProducts);
router.post("/delete", authenticateUser, checkProjectPermission(2), deleteProducts);

export default router;