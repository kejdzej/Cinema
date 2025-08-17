import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// zakup biletu
router.post('/purchase', authRequired, async (req, res) => {
  try {
    const { session_id, seats } = req.body; // seats: array or string?
    if (!session_id || !seats) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // 
    const seatArr = Array.isArray(seats) ? seats : String(seats).split(',');
    const seatStr = seatArr.join(',');

    // cena za 1 miejsce
    const [[session]] = await pool.query(
      'SELECT price FROM sessions WHERE id = ?',
      [session_id]
    );
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    
    const totalPrice = session.price * seatArr.length;

    // zapis biletu
    await pool.query(
      'INSERT INTO tickets (session_id, user_id, seats, price) VALUES (?, ?, ?, ?)',
      [session_id, req.user.id, seatStr, totalPrice]
    );

    res.json({ message: 'Tickets purchased' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// moje bilety
router.get('/mine', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.seats, t.price, s.datetime, m.title
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN movies m ON m.id = s.movie_id
      WHERE t.user_id = ?
      ORDER BY s.datetime DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// wszystkie bilety (blokowanie)
router.get('/session/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT seats FROM tickets WHERE session_id = ?',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
