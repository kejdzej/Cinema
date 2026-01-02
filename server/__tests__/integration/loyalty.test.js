import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { pool } from '../../db.js';

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

describe('Loyalty System Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Check if server is running
    const isRunning = await checkServerRunning();
    if (!isRunning) {
      throw new Error('❌ Server is not running! Please start with: npm run dev');
    }

    // Create test user
    const testUser = {
      name: 'Loyalty Test User',
      email: `loyalty${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    const registerResponse = await request(API_URL)
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerResponse.body.token;

    // Get user ID
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [testUser.email]);
    userId = users[0].id;

    // Give user some points for testing
    await pool.query('UPDATE users SET points = 1000 WHERE id = ?', [userId]);
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM loyalty_history WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM orders WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    await pool.end();
  });

  describe('GET /loyalty/balance', () => {
    test('should get user loyalty points balance', async () => {
      const response = await request(API_URL)
        .get('/api/loyalty/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('points');
      expect(response.body.points).toBe(1000);
    });

    test('should reject unauthenticated request', async () => {
      await request(API_URL)
        .get('/api/loyalty/balance')
        .expect(401);
    });
  });

  describe('GET /loyalty/rewards', () => {
    test('should get available rewards catalog', async () => {
      const response = await request(API_URL)
        .get('/api/loyalty/rewards')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const firstReward = response.body[0];
      expect(firstReward).toHaveProperty('id');
      expect(firstReward).toHaveProperty('name');
      expect(firstReward).toHaveProperty('cost');
      expect(firstReward).toHaveProperty('type');
    });
  });

  describe('POST /loyalty/redeem', () => {
    test('should redeem bar reward successfully', async () => {
      const response = await request(API_URL)
        .post('/api/loyalty/redeem')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reward: 'drink' }) // 100 points
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('order_id');
      expect(response.body).toHaveProperty('newBalance', 900);
    });

    test('should reject redemption with insufficient points', async () => {
      // Try to redeem expensive reward
      const response = await request(API_URL)
        .post('/api/loyalty/redeem')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reward: 'movie-night' }) // 650 points, but user has 900
        .expect(200);

      // Should succeed
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.newBalance).toBe(250);

      // Now try again - should fail
      const failResponse = await request(API_URL)
        .post('/api/loyalty/redeem')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reward: 'popcorn-cola' }) // 300 points, user has 250
        .expect(400);

      expect(failResponse.body).toHaveProperty('message');
      expect(failResponse.body.message).toContain('mało punktów');
    });

    test('should reject unknown reward', async () => {
      const response = await request(API_URL)
        .post('/api/loyalty/redeem')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reward: 'non-existent-reward' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Nieznana nagroda');
    });

    test('should reject free ticket without session', async () => {
      // Reset points
      await pool.query('UPDATE users SET points = 1000 WHERE id = ?', [userId]);

      const response = await request(API_URL)
        .post('/api/loyalty/redeem')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reward: 'free-ticket' })
        .expect(400);

      expect(response.body).toHaveProperty('requiresSession', true);
    });
  });

  describe('GET /loyalty/history', () => {
    test('should get loyalty history', async () => {
      const response = await request(API_URL)
        .get('/api/loyalty/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const historyItem = response.body[0];
        expect(historyItem).toHaveProperty('id');
        expect(historyItem).toHaveProperty('change_amount');
        expect(historyItem).toHaveProperty('description');
        expect(historyItem).toHaveProperty('created_at');
      }
    });
  });

  describe('GET /loyalty/code', () => {
    test('should generate or retrieve loyalty code', async () => {
      const response = await request(API_URL)
        .get('/api/loyalty/code')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('loyalty_code');
      expect(response.body.loyalty_code).toMatch(/^LOY-/);

      // Call again - should get same code
      const response2 = await request(API_URL)
        .get('/api/loyalty/code')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response2.body.loyalty_code).toBe(response.body.loyalty_code);
    });
  });
});
