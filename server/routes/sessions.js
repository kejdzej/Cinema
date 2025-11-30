import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// wszystkie seanse
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.movie_id, s.datetime, s.price, s.hall_id, s.format, m.title, h.name as hall_name, h.capacity as hall_capacity, h.description as hall_type
      FROM sessions s
      JOIN movies m ON m.id = s.movie_id
      LEFT JOIN cinema_halls h ON s.hall_id = h.id
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
      SELECT s.id, s.movie_id, s.datetime, s.price, s.hall_id, s.format, m.title, h.name as hall_name, h.capacity as hall_capacity, h.description as hall_type
      FROM sessions s
      JOIN movies m ON m.id = s.movie_id
      LEFT JOIN cinema_halls h ON s.hall_id = h.id
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

// szuka najblizszego seansu (z bazy)
router.get("/by-movie/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM sessions WHERE movie_id = ? ORDER BY datetime ASC LIMIT 1",
      [movieId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Brak seansów" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Błąd pobierania seansu:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});


export default router;
