// server/routes/customers.js

import express from "express";
import { authenticateUser } from "../connection/middlewares.js";
import {
  getCustomers,
  upsertCustomer,
  deleteCustomer,
} from "../controllers/customers.js";

const router = express.Router();

router.post("/get", authenticateUser, getCustomers);
router.post("/update", authenticateUser, upsertCustomer);
router.post("/delete", authenticateUser, deleteCustomer);

export default router;