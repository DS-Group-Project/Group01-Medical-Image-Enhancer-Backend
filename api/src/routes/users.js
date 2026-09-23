import { Router } from "express";
import { getUserById } from "../../../db/src/usersRepository.js";
import { requireAuth, requireSelfOrAdmin } from "../middleware/auth.js";

const router = Router();

/** GET /users/:userId  – only the user themselves or an admin */
router.get(
  "/:userId",
  requireAuth,
  requireSelfOrAdmin("userId"),
  async (req, res, next) => {
    try {
      const user = await getUserById(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
