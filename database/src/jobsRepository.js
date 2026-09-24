import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, JOBS_TABLE } from "./dynamoClient.js";
import { randomUUID } from "crypto";

/** Create a job record. Idempotent — rejects duplicate jobId. */
export async function createJob({ userId, filename, originalKey }) {
  const jobId = randomUUID();
  const now = new Date().toISOString();

  const job = {
    jobId, userId, filename, originalKey,
    status: "pending",
    enhancedKey: null,
    progress: 0,
    error: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  await ddb.send(new PutCommand({
    TableName: JOBS_TABLE,
    Item: job,
    ConditionExpression: "attribute_not_exists(jobId)",
  }));

  return job;
}

/** Get a single job by id. */
export async function getJob(jobId) {
  const res = await ddb.send(new GetCommand({ TableName: JOBS_TABLE, Key: { jobId } }));
  return res.Item ?? null;
}

/** List a user's jobs, newest first, paginated, optional status filter. */
export async function listJobsForUser(userId, { limit = 10, cursor, status } = {}) {
  const res = await ddb.send(new QueryCommand({
    TableName: JOBS_TABLE,
    IndexName: "UserJobsIndex",
    KeyConditionExpression: "userId = :u",
    ExpressionAttributeValues: {
      ":u": userId,
      ...(status && { ":s": status }),
    },
    ...(status && { FilterExpression: "#st = :s", ExpressionAttributeNames: { "#st": "status" } }),
    ScanIndexForward: false,
    Limit: limit,
    ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, "base64").toString()) : undefined,
  }));

  return {
    jobs: res.Items,
    nextCursor: res.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString("base64")
      : null,
  };
}

/** pending -> processing. Fails harmlessly if already past pending (idempotency guard). */
export async function markProcessing(jobId) {
  const now = new Date().toISOString();
  return ddb.send(new UpdateCommand({
    TableName: JOBS_TABLE,
    Key: { jobId },
    UpdateExpression: "SET #st = :processing, updatedAt = :now",
    ConditionExpression: "#st = :pending",
    ExpressionAttributeNames: { "#st": "status" },
    ExpressionAttributeValues: { ":processing": "processing", ":pending": "pending", ":now": now },
  }));
}

/** processing -> completed */
export async function markCompleted(jobId, enhancedKey) {
  const now = new Date().toISOString();
  return ddb.send(new UpdateCommand({
    TableName: JOBS_TABLE,
    Key: { jobId },
    UpdateExpression: "SET #st = :completed, enhancedKey = :ek, completedAt = :ca, updatedAt = :ca, progress = :p",
    ConditionExpression: "#st = :processing",
    ExpressionAttributeNames: { "#st": "status" },
    ExpressionAttributeValues: {
      ":completed": "completed", ":processing": "processing",
      ":ek": enhancedKey, ":ca": now, ":p": 100,
    },
  }));
}

/** any status -> failed */
export async function markFailed(jobId, errorMessage) {
  const now = new Date().toISOString();
  return ddb.send(new UpdateCommand({
    TableName: JOBS_TABLE,
    Key: { jobId },
    UpdateExpression: "SET #st = :failed, #err = :err, updatedAt = :now",
    ExpressionAttributeNames: { "#st": "status", "#err": "error" },
    ExpressionAttributeValues: { ":failed": "failed", ":err": errorMessage, ":now": now },
  }));
}