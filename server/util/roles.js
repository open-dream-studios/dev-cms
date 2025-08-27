// server/util/roles.js
export const requireAdmin = (req, res, next) => {
  const { admin } = req.user;
  if (admin !== 1) {
    return res.status(403).json("Admins only");
  }
  next();
};
