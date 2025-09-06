// server/routes/customers.js

import express from "express";
import { authenticateUser } from "../connection/middlewares.js";
import {
  getCustomers,
  upsertCustomer,
  deleteCustomer,
  autoCompleteAddress,
  addressDetails
} from "../controllers/customers.js";

const router = express.Router();

router.post("/get", authenticateUser, getCustomers);
router.post("/update", authenticateUser, upsertCustomer);
router.post("/delete", authenticateUser, deleteCustomer);
router.post("/autocomplete", authenticateUser, autoCompleteAddress);
router.post("/place-details", authenticateUser, addressDetails);

export default router;