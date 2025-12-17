import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

async function ensureNewsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS news (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      highlight TINYINT(1) NOT NULL DEFAULT 0,
      published_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

// Public: list news for homepage
router.get('/', async (req, res) => {
  try {
    await ensureNewsTable();
    const [rows] = await pool.query(
      `SELECT id, title, body, highlight, published_at, created_at, updated_at
       FROM news
       ORDER BY COALESCE(published_at, created_at) DESC, id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('News error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

export { ensureNewsTable };
export default router;

