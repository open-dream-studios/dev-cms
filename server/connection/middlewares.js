// server/connection/middleware
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// JWT Authentication middleware
export const authenticateUser = (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // e.g., { email, id, ... }
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};