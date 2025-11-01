// server/middleware/errorMiddleware.ts
import type { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("❌ Express Error:", err);
  res.status(500).json({ success: false, message: "Server error" });
};