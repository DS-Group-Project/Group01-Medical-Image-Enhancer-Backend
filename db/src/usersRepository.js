import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, USERS_TABLE } from "./dynamoClient.js";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/** Create a user. Idempotent on userId; email uniqueness is checked separately below. */
export async function createUser({ email, password, name, role = "user" }) {
  // Enforce unique email before creating — DynamoDB can't do this with a
  // simple condition since email lives on a GSI, not the primary key.
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();

  const user = { userId, email, passwordHash, name, role, createdAt: now };

  await ddb.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: user,
    ConditionExpression: "attribute_not_exists(userId)",
  }));

  // Never return the hash to callers — API layer should never see or log it.
  const { passwordHash: _drop, ...safeUser } = user;
  return safeUser;
}

/** Get a user by id (internal/API use, e.g. attaching user info to a job). */
export async function getUserById(userId) {
  const res = await ddb.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }));
  if (!res.Item) return null;
  const { passwordHash: _drop, ...safeUser } = res.Item;
  return safeUser;
}

/** Get a user by email — used at login. Returns the hash, since verifyPassword needs it. */
export async function getUserByEmail(email) {
  const res = await ddb.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: "EmailIndex",
    KeyConditionExpression: "email = :e",
    ExpressionAttributeValues: { ":e": email },
    Limit: 1,
  }));
  return res.Items?.[0] ?? null;
}

/** Verify a plaintext password against a user's stored hash at login. */
export async function verifyPassword(user, plaintextPassword) {
  if (!user?.passwordHash) return false;
  return bcrypt.compare(plaintextPassword, user.passwordHash);
}