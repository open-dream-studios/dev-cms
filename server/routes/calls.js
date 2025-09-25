// server/routes/calls.js
import express from "express";
import { handleIncomingCall, tokenHandler, callStatusHandler, declineCallHandler, answeredHandler } from "../controllers/calls.js";

const router = express.Router();

router.post("/", handleIncomingCall);
router.post("/token", tokenHandler);
router.post("/decline", declineCallHandler);
router.post("/call-status", callStatusHandler);
router.post("/answered", answeredHandler);

export default router;