// server/util/roles.js
import type { Request, Response, NextFunction } from "express";

export const adminEmail = "opendreamstudios@gmail.com";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const admin = req.user?.admin;
  if (admin) {
    res.status(403).json("Admins only");
    return;
  }
  next();
};
