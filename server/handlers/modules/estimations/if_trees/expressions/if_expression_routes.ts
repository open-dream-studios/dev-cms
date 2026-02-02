// server/handlers/modules/estimations/if_trees/expressions/if_expression_routes.ts
import express from "express";
import { authenticateUser } from "../../../../../util/auth.js";
import { checkProjectPermission } from "../../../../../util/permissions.js";
import { transactionHandler, errorHandler } from "../../../../../util/handlerWrappers.js";
import {
  upsertExpression,
  deleteExpression
} from "./if_expression_controllers.js";

const router = express.Router();

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertExpression)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteExpression)
);

export default router;