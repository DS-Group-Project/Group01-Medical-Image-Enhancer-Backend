import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * DynamoDB client configuration.
 *
 * In development you can run DynamoDB Local (Docker) and set:
 *   DYNAMODB_ENDPOINT=http://localhost:8000
 *   AWS_ACCESS_KEY_ID=local
 *   AWS_SECRET_ACCESS_KEY=local
 *
 * In production (AWS) simply leave DYNAMODB_ENDPOINT unset — the SDK
 * will use the real AWS endpoint with the credentials from the environment.
 */
const clientConfig = {
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
  };
}

const client = new DynamoDBClient(clientConfig);

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const JOBS_TABLE = "Jobs";
export const USERS_TABLE = "Users";