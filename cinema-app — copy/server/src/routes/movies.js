import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM movies ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
