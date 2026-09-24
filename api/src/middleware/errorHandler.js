export function errorHandler(err, req, res, next) {
  console.error(err);

  // Known business errors from repositories
  if (err.message === "EMAIL_ALREADY_EXISTS") {
    return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
  }

  // DynamoDB conditional check failures (idempotency guards)
  if (err.name === "ConditionalCheckFailedException") {
    return res.status(409).json({ error: "CONDITION_FAILED", message: err.message });
  }

  // Validation / bad input
  if (err.status === 400) {
    return res.status(400).json({ error: err.message || "BAD_REQUEST" });
  }

  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
}
