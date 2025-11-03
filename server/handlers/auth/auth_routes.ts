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
  updateCurrentUser
} from "./auth_controllers.js";
import { rateLimiter } from "../../connection/middlewares.js"
import { transactionHandler } from "../../util/handlerWrappers.js";

const router = express.Router();

router.post("/login", rateLimiter, transactionHandler(login));
router.post("/logout", transactionHandler(logout));
router.post("/register", transactionHandler(register));
router.post("/google", rateLimiter, transactionHandler(googleAuth));

router.post("/send-code", rateLimiter, transactionHandler(sendCode));
router.post("/check-code", rateLimiter, transactionHandler(checkCode));
router.post("/password-reset", rateLimiter, transactionHandler(passwordReset));

router.get("/current-user", transactionHandler(getCurrentUser));
router.put("/update-current-user", transactionHandler(updateCurrentUser));

export default router;
