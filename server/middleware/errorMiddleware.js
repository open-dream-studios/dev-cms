// middleware/errorMiddleware.js
export const errorMiddleware = (err, req, res, next) => {
  console.error("❌ Express Error:", err);
  res.status(500).json({ success: false, message: "Server error" });
};
