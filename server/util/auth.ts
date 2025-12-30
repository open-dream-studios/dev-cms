// server/util/auth.js
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "@open-dream/shared";

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token =
    req.cookies?.accessToken || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    req.user = {
      user_id:
        typeof decoded.user_id === "string"
          ? decoded.user_id
          : String(decoded.user_id),
      email: decoded.email,
      admin: Boolean(decoded.admin),
    };
    next();
  } catch (err: any) {
    res.status(403).json({ error: "Invalid token" });
    return;
  }
};
