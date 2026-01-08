import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { pool } from '../../db.js';

// Import app without starting server
const API_URL = 'http://localhost:4000';

// Helper to check if server is running
async function checkServerRunning() {
  try {
    await request(API_URL).get('/').timeout(2000);
    return true;
  } catch (e) {
    return false;
  }
}

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    const isRunning = await checkServerRunning();
    if (!isRunning) {
      throw new Error('Server is not running!');
    }
  });
  const testUser = {
    name: 'Test User',
    email: `test@example.com`,
    password: 'Haslo123!',
  };

  let authToken;

  afterAll(async () => {
    // Cleanup: delete test user
    if (testUser.email) {
      await pool.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    }
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toContain('zarejestrowany');
    });

    test('should reject duplicate email', async () => {
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('już w użyciu');
    });

    test('should reject missing required fields', async () => {
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('wymagane');
      expect(response.body.message.length).toBeGreaterThan(5);
    });

    test('should reject weak password', async () => {
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: `test2${Date.now()}@example.com`,
          password: '123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Hasło');
    });
  });

  describe('POST /auth/login', () => {
    test('should login with correct credentials', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('name', testUser.name);
      expect(response.body.user).toHaveProperty('role');

      authToken = response.body.token;
    });

    test('should reject incorrect password', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'haslo123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Nieprawidłowy email lub hasło');
    });

    test('should reject non-existent user', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'haslo123',
        })
        .expect(400);

      expect(response.body.message).toContain('Nieprawidłowy email lub hasło');
    });

    test('should reject missing credentials', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Email i hasło są wymagane');
    });
  });

  describe('GET /auth/me', () => {
    test('should get current user with valid token', async () => {
      const response = await request(API_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('role');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    test('should reject request without token', async () => {
      const response = await request(API_URL)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(API_URL)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
