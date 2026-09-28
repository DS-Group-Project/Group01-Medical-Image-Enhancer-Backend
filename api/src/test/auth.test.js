import { describe, it, expect, vi, beforeEach } from 'vitest';
process.env.JWT_SECRET = 'test-secret';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import * as usersRepo from '../../../database/src/usersRepository.js';
import authRoutes from '../routes/auth.js';

// Mock the database repository
vi.mock('../../../database/src/usersRepository.js', () => ({
  createUser: vi.fn(),
  getUserByEmail: vi.fn(),
  verifyPassword: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Error handler for tests
app.use((err, req, res, next) => {
  if (err.message === "EMAIL_ALREADY_EXISTS") {
    return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
  }
  res.status(500).json({ error: 'INTERNAL' });
});

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should block invalid payload formats (zod validation)', async () => {
      const res = await request(app).post('/auth/register').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('should register a new user successfully', async () => {
      usersRepo.createUser.mockResolvedValue({
        userId: 'u1',
        email: 'test@t.com',
        name: 'Test',
        role: 'user'
      });

      const res = await request(app).post('/auth/register').send({
        email: 'test@t.com',
        password: 'pwd',
        name: 'Test'
      });

      expect(res.status).toBe(201);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body.user.email).toBe('test@t.com');
    });

    it('should block duplicate emails', async () => {
      usersRepo.createUser.mockRejectedValue(new Error('EMAIL_ALREADY_EXISTS'));

      const res = await request(app).post('/auth/register').send({
        email: 'dupe@t.com',
        password: 'pwd',
        name: 'Test'
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /auth/login', () => {
    it('should reject missing fields', async () => {
      const res = await request(app).post('/auth/login').send({ email: 'test@t.com' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid credentials', async () => {
      usersRepo.getUserByEmail.mockResolvedValue(null);

      const res = await request(app).post('/auth/login').send({
        email: 'wrong@t.com',
        password: 'pwd'
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should login successfully', async () => {
      usersRepo.getUserByEmail.mockResolvedValue({
        userId: 'u1',
        email: 'test@t.com',
        name: 'Test',
        role: 'user',
        passwordHash: 'hash'
      });
      usersRepo.verifyPassword.mockResolvedValue(true);

      const res = await request(app).post('/auth/login').send({
        email: 'test@t.com',
        password: 'pwd'
      });

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });
  });
});
