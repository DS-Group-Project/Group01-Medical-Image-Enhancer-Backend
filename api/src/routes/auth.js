import { Router } from "express";
import { z } from "zod";
import {
  createUser,
  getUserByEmail,
  verifyPassword,
} from "../../../database/src/usersRepository.js";
import { signToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many authentication attempts, please try again later." },
});

const registerSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    name: z.string().min(1)
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
};

/** POST /auth/register */
router.post("/register", authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Role is explicitly omitted so it defaults to "user" in the repository
    const user = await createUser({ email, password, name });
    const token = signToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/login */
router.post("/login", authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }

    const valid = await verifyPassword(user, password);
    if (!valid) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }

    const { passwordHash, ...safeUser } = user;
    const token = signToken(safeUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/logout */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

/** GET /auth/me  – returns the current user from the token */
router.get("/me", async (req, res, next) => {
  // This route needs requireAuth – we’ll mount it protected in app.js
  try {
    // req.user is set by requireAuth
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
});

export default router;
