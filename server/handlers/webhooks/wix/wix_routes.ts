// server/handlers/webhooks/wix/wix_routes.ts
import { Router } from "express";
import { handleLogView } from "./wix_controllers.js";
import { transactionHandler } from "../../../util/handlerWrappers.js";

const router = Router();

router.post("/log", transactionHandler(handleLogView));

export default router;