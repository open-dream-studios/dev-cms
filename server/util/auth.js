// server/util/auth.js
import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      admin: decoded.admin,
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};