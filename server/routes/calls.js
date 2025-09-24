// server/routes/calls.js
import express from "express";
import { handleIncomingCall, tokenHandler } from "../controllers/calls.js";

const router = express.Router();

router.post("/", handleIncomingCall);
router.post("/token", tokenHandler);

export default router;