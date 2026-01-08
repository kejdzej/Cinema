import { describe, test, expect, afterAll } from '@jest/globals';
import { pool } from '../../db.js';

describe('Database Unit Tests', () => {

  afterAll(async () => {
    await pool.end();
  });

  test('should connect to database', async () => {
    const [result] = await pool.query('SELECT 1 as test');
    expect(result[0].test).toBe(1);
  });

  test('should have all 9 core application tables', async () => {
    const [tables] = await pool.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'cinema'"
    );

    const tableNames = tables.map(t => t.TABLE_NAME);

    const requiredTables = [
      'users',
      'movies',
      'sessions',
      'tickets',
      'payments',
      'orders',
      'cinema_halls',
      'loyalty_history',
      'news'
    ];

    requiredTables.forEach(table => {
      expect(tableNames).toContain(table);
    });
  });
});
