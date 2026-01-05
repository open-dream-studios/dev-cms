// server/handlers/public/customerData/customerData_routes.ts
import express from "express";
import { getCustomerData } from "./customerData_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(getCustomerData)
);

export default router;
