import express from "express";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import { transactionHandler, errorHandler } from "../../../../util/handlerWrappers.js";
import {
  listVariables,
  upsertVariable,
  deleteVariable
} from "./variable_controllers.js";

const router = express.Router();

router.post(
  "/list",
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(listVariables)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertVariable)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteVariable)
);

export default router;