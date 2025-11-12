// server/handlers/modules/calls/calls_routes.js
import express from "express";
import {
  handleIncomingCall,
  tokenHandler,
  callStatusHandler,
  declineCallHandler,
  handleIncomingSMS
} from "./calls_controller.js";

const router = express.Router();

router.post("/", handleIncomingCall);
router.post("/token", tokenHandler);
router.post("/decline", declineCallHandler);
router.post("/call-status", callStatusHandler);
router.post("/sms", handleIncomingSMS);

export default router;
