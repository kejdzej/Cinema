import { Router } from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Nieprawidłowy format email' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Hasło musi mieć minimum 6 znaków' });
    }

    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (exists.length) return res.status(400).json({ message: 'Email jest już w użyciu' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [sanitizedName, sanitizedEmail, hash]);

    const token = jwt.sign({
      id: result.insertId,
      email: sanitizedEmail,
      name: sanitizedName,
      role: 'user'
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Użytkownik zarejestrowany pomyślnie',
      token
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email i hasło są wymagane' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Nieprawidłowy format email' });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const [rows] = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [sanitizedEmail]);
    if (!rows.length) return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Get current user
router.get('/me', authRequired, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, points, loyalty_code FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    res.json(users[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

export default router;
