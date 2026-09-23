import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import jobsRoutes, { listUserJobs } from "./routes/jobs.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth, requireSelfOrAdmin } from "./middleware/auth.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check (public)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth routes
app.use("/auth", authRoutes);

// Protected /auth/me
app.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Users
app.use("/users", usersRoutes);

// List jobs for a user (owner or admin only)
app.get(
  "/users/:userId/jobs",
  requireAuth,
  requireSelfOrAdmin("userId"),
  listUserJobs
);

// Jobs
app.use("/jobs", jobsRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
