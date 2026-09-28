import "dotenv/config";
import express from "express";
import { z } from "zod";
import { validate } from "./middleware/validate.js";
import rateLimit from "express-rate-limit";
import cors from "cors";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import fs from "fs";
import os from "os";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import jobsRoutes, { listUserJobs } from "./routes/jobs.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth, requireSelfOrAdmin } from "./middleware/auth.js";
import { createJob, getJob, listJobsForUser, deleteJobRecord } from "../../database/src/jobsRepository.js";
import { validateFileSignature } from "./utils/fileValidation.js";
import logger from "./utils/logger.js";
import helmet from "helmet";

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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
import cookieParser from "cookie-parser";
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: "Too many requests, please try again later." }
});
app.use(globalLimiter);

import { doubleCsrf } from "csrf-csrf";
const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "default_csrf_secret_for_dev_only",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

// Endpoint for frontend to fetch the CSRF token
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: generateToken(res, req) });
});

// Apply CSRF protection to all subsequent routes (except if using Bearer token for programmatic access)
app.use((req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return next();
  }
  doubleCsrfProtection(req, res, next);
});

// ─── AWS Clients ──────────────────────────────────────────────────────────────
const s3 = new S3Client({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const sqs = new SQSClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });

const RAW_BUCKET = process.env.RAW_BUCKET_NAME;
const PROCESSED_BUCKET = process.env.PROCESSED_BUCKET_NAME;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

// ─── Multer (Disk Storage) ────────────────────────────────────────────────────
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 52_428_800 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/dicom"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
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

    for (const file of req.files) {
      const trueMimeType = await validateFileSignature(file.path);
      if (!trueMimeType) {
        // Clean up files immediately since we are aborting early
        req.files.forEach(f => {
          if (f.path && fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        });
        return res.status(400).json({ error: `Invalid file content for file: ${file.originalname}` });
      }
      file.trueMimeType = trueMimeType;
    }

    const jobPromises = req.files.map(async (file) => {
      const imageKey = `raw/${req.user.userId}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

      try {
        // 1. Upload raw image to S3 from disk
        const fileStream = fs.createReadStream(file.path);
        
        logger.info({ action: "audit_s3_upload", userId: req.user.userId, bucket: RAW_BUCKET, key: imageKey }, "Uploading original image to S3");
        
        await s3.send(new PutObjectCommand({
          Bucket: RAW_BUCKET,
          Key: imageKey,
          Body: fileStream,
          ContentType: file.trueMimeType,
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

        return job;
      } finally {
        // Ensure temporary file is cleaned up
        if (file.path && fs.existsSync(file.path)) {
          await fs.promises.unlink(file.path).catch(err => logger.error({ err }, "File cleanup error"));
        }
      }
    });

    const rawJobs = await Promise.all(jobPromises);
    const jobs = rawJobs.map(normaliseJob);
    res.status(201).json({ jobs });
  } catch (err) {
    // If an error occurs, clean up any remaining uploaded files
    if (req.files) {
      req.files.forEach(f => {
        if (f.path && fs.existsSync(f.path)) {
          fs.unlinkSync(f.path);
        }
      });
    }
    next(err);
  }
});

// ─── Jobs Routes ──────────────────────────────────────────────────────────────

const jobsQuerySchema = {
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
    cursor: z.string().optional(),
    status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    search: z.string().optional() // frontend might send this
  }).passthrough()
};

// GET /jobs — list the current user's jobs (paginated)
app.get("/jobs", requireAuth, validate(jobsQuerySchema), async (req, res, next) => {
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
      logger.warn({ action: "audit_access_denied", jobId: job.jobId, userId: req.user.userId }, "Unauthorized image access attempt");
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const type = req.query.type === "enhanced" ? "enhanced" : "original";
    
    logger.info({ 
      action: "audit_download_image_url", 
      jobId: job.jobId, 
      userId: req.user.userId, 
      imageType: type,
      download: req.query.download === "true" 
    }, "User requested image presigned URL");

    const key = type === "enhanced" ? job.enhancedKey : job.originalKey;

    if (!key) return res.status(404).json({ error: "IMAGE_NOT_AVAILABLE" });

    const bucket = type === "enhanced" ? PROCESSED_BUCKET : RAW_BUCKET;
    
    const commandParams = { Bucket: bucket, Key: key };
    if (req.query.download === "true") {
      commandParams.ResponseContentDisposition = `attachment; filename="${job.filename}"`;
    }

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand(commandParams),
      { expiresIn: 900 } // 15 minutes
    );

    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// GET /jobs/:jobId/image/stream?type=original|enhanced
// Proxy the image directly through the API to avoid browser CORS issues
app.get("/jobs/:jobId/image/stream", requireAuth, async (req, res, next) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "JOB_NOT_FOUND" });
    if (req.user.role !== "admin" && job.userId !== req.user.userId) {
      logger.warn({ action: "audit_access_denied", jobId: job.jobId, userId: req.user.userId }, "Unauthorized image stream attempt");
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const type = req.query.type === "enhanced" ? "enhanced" : "original";
    
    logger.info({ 
      action: "audit_stream_image", 
      jobId: job.jobId, 
      userId: req.user.userId, 
      imageType: type
    }, "User streamed image");

    const key = type === "enhanced" ? job.enhancedKey : job.originalKey;
    if (!key) return res.status(404).json({ error: "IMAGE_NOT_AVAILABLE" });

    const bucket = type === "enhanced" ? PROCESSED_BUCKET : RAW_BUCKET;
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    
    const s3Response = await s3.send(command);
    res.setHeader("Content-Type", s3Response.ContentType || "image/jpeg");
    s3Response.Body.pipe(res);
  } catch (err) {
    next(err);
  }
});

// DELETE /jobs/:jobId
app.delete("/jobs/:jobId", requireAuth, async (req, res, next) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "JOB_NOT_FOUND" });
    if (req.user.role !== "admin" && job.userId !== req.user.userId) {
      logger.warn({ action: "audit_access_denied", jobId: job.jobId, userId: req.user.userId }, "Unauthorized job delete attempt");
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    logger.info({ action: "audit_delete_job", jobId: job.jobId, userId: req.user.userId }, "User hard-deleting job");

    // 1. Delete from S3 RAW_BUCKET
    if (job.originalKey) {
      await s3.send(new DeleteObjectCommand({ Bucket: RAW_BUCKET, Key: job.originalKey })).catch(err => {
        logger.error({ err, jobId: job.jobId }, "Failed to delete original image from S3");
      });
    }

    // 2. Delete from S3 PROCESSED_BUCKET
    if (job.enhancedKey) {
      await s3.send(new DeleteObjectCommand({ Bucket: PROCESSED_BUCKET, Key: job.enhancedKey })).catch(err => {
        logger.error({ err, jobId: job.jobId }, "Failed to delete enhanced image from S3");
      });
    }

    // 3. Delete from DynamoDB
    await deleteJobRecord(job.jobId);

    res.status(200).json({ message: "Job successfully deleted" });
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
