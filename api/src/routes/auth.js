import { Router } from "express";
import {
  createUser,
  getUserByEmail,
  verifyPassword,
} from "../../../db/src/usersRepository.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

/** POST /auth/register */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: "email, password and name are required",
      });
    }

    const user = await createUser({ email, password, name, role });
    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/login */
router.post("/login", async (req, res, next) => {
  console.log(req.body)
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required",
      });
    }

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

    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
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
