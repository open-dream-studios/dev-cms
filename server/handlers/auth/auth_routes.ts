// server/handlers/auth/auth_routes.js
import express from "express";
import {
  login,
  logout,
  register,
  googleAuth,
  sendCode,
  checkCode,
  passwordReset,
  getCurrentUser,
  updateCurrentUser,
  acceptInvite,
} from "./auth_controllers.js";
import { rateLimiter } from "../../connection/middlewares.js";
import { transactionHandler } from "../../util/handlerWrappers.js";
import { authenticateUser } from "../../util/auth.js";
import { verifyVercelProxy } from "../../util/verifyProxy.js";

const router = express.Router();

router.post("/login", verifyVercelProxy, rateLimiter, transactionHandler(login));
router.post("/logout", verifyVercelProxy, transactionHandler(logout));
router.post("/register", verifyVercelProxy, transactionHandler(register));
router.post("/google", verifyVercelProxy, rateLimiter, transactionHandler(googleAuth));

router.post("/send-code", verifyVercelProxy, rateLimiter, transactionHandler(sendCode));
router.post("/check-code", verifyVercelProxy, rateLimiter, transactionHandler(checkCode));
router.post("/password-reset", verifyVercelProxy,rateLimiter, transactionHandler(passwordReset));

router.get("/me", verifyVercelProxy, transactionHandler(getCurrentUser));
router.put("/update-current-user", verifyVercelProxy, transactionHandler(updateCurrentUser));

router.post(
  "/accept-invite",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(acceptInvite)
);

export default router;
