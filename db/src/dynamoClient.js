import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:8000", // points at your local Docker container
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const JOBS_TABLE = "Jobs";
export const USERS_TABLE = "Users";