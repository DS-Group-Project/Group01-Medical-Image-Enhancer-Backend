import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing.");
}

/** Sign a JWT for a user */
export function signToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

/**
 * Middleware: requires a valid Bearer token.
 * Attaches `req.user = { userId, email, role }`
 */
export function requireAuth(req, res, next) {
  // Allow both cookie and Authorization header (for backward compatibility / worker scripts)
  const header = req.headers.authorization;
  const cookieToken = req.cookies?.token;

  const token = cookieToken || (header && header.startsWith("Bearer ") ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ error: "MISSING_TOKEN" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

/**
 * Optional: only allow the owner of the resource (or admin)
 * Usage after requireAuth: requireSelfOrAdmin("userId")
 */
export function requireSelfOrAdmin(paramName = "userId") {
  return (req, res, next) => {
    const targetId = req.params[paramName];
    if (req.user.role === "admin" || req.user.userId === targetId) {
      return next();
    }
    return res.status(403).json({ error: "FORBIDDEN" });
  };
}

/**
 * Middleware: only allow specific roles
 * Usage: requireRole(["admin", "worker"])
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    next();
  };
}
