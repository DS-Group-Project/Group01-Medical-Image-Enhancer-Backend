# API

| Endpoint | Auth required? | Notes |
|----------|----------------|-------|
| `POST /auth/register` | No | Returns `{ user, token }` |
| `POST /auth/login` | No | Returns `{ user, token }` |
| `GET /auth/me` | Yes | Current user from token |
| `GET /users/:userId` | Yes | Self or admin only |
| `POST /jobs` | Yes | Job is forced to `req.user.userId` |
| `GET /jobs/:jobId` | Yes | Owner or admin only |
| `GET /users/:userId/jobs` | Yes | Self or admin only |
| `PATCH /jobs/:jobId/*` | Yes | Currently any authenticated user (you can lock to admin/worker later) |
