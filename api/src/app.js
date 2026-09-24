import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import jobsRoutes, { listUserJobs } from "./routes/jobs.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth, requireSelfOrAdmin } from "./middleware/auth.js";
import { createJob, getJob, listJobsForUser } from "../../database/src/jobsRepository.js";

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow Vite dev server on either port it picks (3000 or 3001)
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman) or matching origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ─── AWS Clients ──────────────────────────────────────────────────────────────
const s3 = new S3Client({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const sqs = new SQSClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });

const RAW_BUCKET = process.env.RAW_BUCKET_NAME;
const PROCESSED_BUCKET = process.env.PROCESSED_BUCKET_NAME;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

// ─── Multer (in-memory) ───────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 52_428_800 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/dicom", "application/octet-stream"];
    cb(null, true); // Accept all — stricter server-side validation can be added
  },
});

// ─── Health Check (public) ────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);

// Protected /auth/me
app.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ─── Users ────────────────────────────────────────────────────────────────────
app.use("/users", usersRoutes);

// List jobs for a specific user (owner or admin only)
app.get(
  "/users/:userId/jobs",
  requireAuth,
  requireSelfOrAdmin("userId"),
  listUserJobs
);

// ─── Upload Endpoint ──────────────────────────────────────────────────────────
// POST /upload  — accepts one or more image files, uploads them to S3,
//                creates a Job record in DynamoDB, and queues the job via SQS.
app.post("/upload", requireAuth, upload.array("images", 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }

    const jobs = [];

    for (const file of req.files) {
      const imageKey = `raw/${req.user.userId}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

      // 1. Upload raw image to S3
      await s3.send(new PutObjectCommand({
        Bucket: RAW_BUCKET,
        Key: imageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      // 2. Create job record in DynamoDB
      const job = await createJob({
        userId: req.user.userId,
        filename: file.originalname,
        originalKey: imageKey,
      });

      // 3. Send message to SQS
      await sqs.send(new SendMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MessageBody: JSON.stringify({
          jobId: job.jobId,
          originalKey: imageKey,
        }),
      }));

      jobs.push(job);
    }

    res.status(201).json({ jobs });
  } catch (err) {
    next(err);
  }
});

// ─── Jobs Routes ──────────────────────────────────────────────────────────────
// GET /jobs — list the current user's jobs (paginated)
app.get("/jobs", requireAuth, async (req, res, next) => {
  try {
    const { limit, cursor, status } = req.query;
    const result = await listJobsForUser(req.user.userId, {
      limit: limit ? Number(limit) : 10,
      cursor,
      status,
    });

    // Normalise field names to what the frontend expects
    const jobs = result.jobs.map(normaliseJob);
    res.json({ jobs, nextCursor: result.nextCursor });
  } catch (err) {
    next(err);
  }
});

// Presigned URL endpoint so the frontend can display images without leaking AWS creds
// GET /jobs/:jobId/image?type=original|enhanced
app.get("/jobs/:jobId/image", requireAuth, async (req, res, next) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "JOB_NOT_FOUND" });
    if (req.user.role !== "admin" && job.userId !== req.user.userId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const type = req.query.type === "enhanced" ? "enhanced" : "original";
    const key = type === "enhanced" ? job.enhancedKey : job.originalKey;

    if (!key) return res.status(404).json({ error: "IMAGE_NOT_AVAILABLE" });

    const bucket = type === "enhanced" ? PROCESSED_BUCKET : RAW_BUCKET;
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 900 } // 15 minutes
    );

    res.json({ url });
  } catch (err) {
    next(err);
  }
});

app.use("/jobs", jobsRoutes);

// ─── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Helper ───────────────────────────────────────────────────────────────────
/** Map DynamoDB field names to what the frontend services expect */
function normaliseJob(job) {
  return {
    id: job.jobId,
    jobId: job.jobId,
    userId: job.userId,
    filename: job.filename,
    status: job.status,
    originalKey: job.originalKey,
    enhancedKey: job.enhancedKey,
    progress: job.progress ?? 0,
    error: job.error ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt ?? null,
  };
}

export default app;
