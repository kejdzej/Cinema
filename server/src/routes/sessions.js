import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// wszystkie seanse
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.movie_id, s.datetime, s.price, m.title
      FROM sessions s
      JOIN movies m ON m.id = s.movie_id
      ORDER BY s.datetime ASC
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Jeden seans po id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.movie_id, s.datetime, s.price, m.title
      FROM sessions s
      JOIN movies m ON m.id = s.movie_id
      WHERE s.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
