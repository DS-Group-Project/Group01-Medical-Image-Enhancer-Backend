import { Router } from "express";
import {
  createJob,
  getJob,
  listJobsForUser,
  markProcessing,
  markCompleted,
  markFailed,
} from "../../../database/src/jobsRepository.js";
import { requireAuth, requireSelfOrAdmin, requireRole } from "../middleware/auth.js";
import logger from "../utils/logger.js";

const router = Router();

/** POST /jobs  – any authenticated user can create a job for themselves */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { filename, originalKey } = req.body;
    // Force the job to belong to the authenticated user
    const userId = req.user.userId;

    if (!filename || !originalKey) {
      return res.status(400).json({
        error: "filename and originalKey are required",
      });
    }

    const job = await createJob({ userId, filename, originalKey });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

/** GET /jobs/:jobId */
router.get("/:jobId", requireAuth, async (req, res, next) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "JOB_NOT_FOUND" });
    }

    // Only owner or admin can see the job
    if (req.user.role !== "admin" && job.userId !== req.user.userId) {
      logger.warn({ action: "audit_access_denied", jobId: job.jobId, userId: req.user.userId }, "Unauthorized job access attempt");
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    logger.info({ action: "audit_view_job", jobId: job.jobId, userId: req.user.userId }, "User viewed job details");

    res.json({
      id: job.jobId,
      jobId: job.jobId,
      filename: job.filename,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      progress: job.progress,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /users/:userId/jobs */
export async function listUserJobs(req, res, next) {
  try {
    const { limit, cursor, status } = req.query;
    const result = await listJobsForUser(req.params.userId, {
      limit: limit ? Number(limit) : 10,
      cursor,
      status,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** PATCH /jobs/:jobId/processing  – typically called by a worker */
router.patch("/:jobId/processing", requireAuth, requireRole(["worker", "admin"]), async (req, res, next) => {
  try {
    await markProcessing(req.params.jobId);
    const job = await getJob(req.params.jobId);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

/** PATCH /jobs/:jobId/completed */
router.patch("/:jobId/completed", requireAuth, requireRole(["worker", "admin"]), async (req, res, next) => {
  try {
    const { enhancedKey } = req.body;
    if (!enhancedKey) {
      return res.status(400).json({ error: "enhancedKey is required" });
    }

    await markCompleted(req.params.jobId, enhancedKey);
    const job = await getJob(req.params.jobId);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

/** PATCH /jobs/:jobId/failed */
router.patch("/:jobId/failed", requireAuth, requireRole(["worker", "admin"]), async (req, res, next) => {
  try {
    const { error } = req.body;
    if (!error) {
      return res.status(400).json({ error: "error message is required" });
    }

    await markFailed(req.params.jobId, error);
    const job = await getJob(req.params.jobId);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

export default router;
