import { verifyToken } from "../utils/auth.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const auth = token ? verifyToken(token) : null;

  if (!auth) {
    return res.status(401).json({ message: "Login required" });
  }

  req.auth = auth;
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.auth.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  });
}
