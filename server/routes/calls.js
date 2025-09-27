// server/routes/calls.js
import express from "express";
import {
  handleIncomingCall,
  tokenHandler,
  callStatusHandler,
  declineCallHandler
} from "../controllers/calls.js";

const router = express.Router();

router.post("/", handleIncomingCall);
router.post("/token", tokenHandler);
router.post("/decline", declineCallHandler);
router.post("/call-status", callStatusHandler);

export default router;
