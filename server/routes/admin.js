import { Router } from 'express';
import { pool } from '../db.js';
import { adminRequired } from '../middleware/admin.js';
import { authRequired } from '../middleware/auth.js'; // DODANY IMPORT

const router = Router();

// Wszystkie filmy - authRequired PIERWSZY, potem adminRequired
router.get('/movies', authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM movies ORDER BY id DESC');
    console.log('Movies loaded:', rows.length);
    res.json(rows);
  } catch (e) {
    console.error('Movies error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Dodaj film
router.post('/movies', authRequired, adminRequired, async (req, res) => {
  try {
    const { title, description, duration, poster } = req.body;
    if (!title || !duration) return res.status(400).json({ message: 'Tytuł i czas trwania są wymagane' });

    const [result] = await pool.query(
      'INSERT INTO movies (title, description, duration, poster) VALUES (?, ?, ?, ?)',
      [title, description || '', parseInt(duration), poster || '']
    );
    console.log('Movie added:', result.insertId);
    res.json({ message: 'Film dodany', id: result.insertId });
  } catch (e) {
    console.error('Add movie error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Edytuj film
router.put('/movies/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { title, description, duration, poster } = req.body;
    const [result] = await pool.query(
      'UPDATE movies SET title = ?, description = ?, duration = ?, poster = ? WHERE id = ?',
      [title, description, parseInt(duration), poster, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Film nie znaleziony' });
    res.json({ message: 'Film zaktualizowany' });
  } catch (e) {
    console.error('Update movie error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Usuń film
router.delete('/movies/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM movies WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Film nie znaleziony' });
    res.json({ message: 'Film usunięty' });
  } catch (e) {
    console.error('Delete movie error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Wszystkie seanse
router.get('/sessions', authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, m.title as movie_title, h.name as hall_name, h.capacity as hall_capacity
      FROM sessions s 
      JOIN movies m ON s.movie_id = m.id 
      LEFT JOIN cinema_halls h ON s.hall_id = h.id
      ORDER BY s.datetime DESC
    `);
    console.log('Sessions loaded:', rows.length);
    res.json(rows);
  } catch (e) {
    console.error('Sessions error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Dodaj seans
router.post('/sessions', authRequired, adminRequired, async (req, res) => {
  try {
    const { movie_id, datetime, price, hall_id } = req.body;
    if (!movie_id || !datetime || !price) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }

    const [result] = await pool.query(
      'INSERT INTO sessions (movie_id, datetime, price, hall_id) VALUES (?, ?, ?, ?)',
      [movie_id, datetime, price, hall_id || null]
    );
    res.json({ message: 'Seans dodany', id: result.insertId });
  } catch (e) {
    console.error('Add session error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Edytuj seans
router.put('/sessions/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { movie_id, datetime, price, hall_id } = req.body;
    const [result] = await pool.query(
      'UPDATE sessions SET movie_id = ?, datetime = ?, price = ?, hall_id = ? WHERE id = ?',
      [movie_id, datetime, price, hall_id || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Seans nie znaleziony' });
    res.json({ message: 'Seans zaktualizowany' });
  } catch (e) {
    console.error('Update session error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Usuń seans
router.delete('/sessions/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM sessions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Seans nie znaleziony' });
    res.json({ message: 'Seans usunięty' });
  } catch (e) {
    console.error('Delete session error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Wszyscy użytkownicy
router.get('/users', authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    console.log('Users loaded:', rows.length);
    res.json(rows);
  } catch (e) {
    console.error('Users error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Zmień rolę użytkownika
router.patch('/users/:id/role', authRequired, adminRequired, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'employee', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Nieprawidłowa rola' });
    }

    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json({ message: 'Rola zaktualizowana' });
  } catch (e) {
    console.error('Update user role error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Wszystkie zamówienia
router.get('/orders', authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);

    const result = rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
    }));

    console.log('Orders loaded:', result.length);
    res.json(result);
  } catch (e) {
    console.error('Orders error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Wszystkie bilety
router.get('/tickets', authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, u.name as user_name, u.email as user_email, 
             s.datetime, m.title as movie_title
      FROM tickets t 
      JOIN users u ON t.user_id = u.id 
      JOIN sessions s ON t.session_id = s.id 
      JOIN movies m ON s.movie_id = m.id 
      ORDER BY t.created_at DESC
    `);
    console.log('Tickets loaded:', rows.length);
    res.json(rows);
  } catch (e) {
    console.error('Tickets error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Usuń użytkownika
router.delete('/users/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    console.log('User deleted:', req.params.id);
    res.json({ message: 'Użytkownik usunięty' });
  } catch (e) {
    console.error('Delete user error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// ========== ZARZĄDZANIE SALAMI KINOWYMI ==========

// Wszystkie sale
router.get('/halls', authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cinema_halls ORDER BY name ASC');
    res.json(rows);
  } catch (e) {
    console.error('Halls error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Dodaj salę
router.post('/halls', authRequired, adminRequired, async (req, res) => {
  try {
    const { name, capacity, description } = req.body;
    if (!name || !capacity) {
      return res.status(400).json({ message: 'Nazwa i pojemność są wymagane' });
    }

    const [result] = await pool.query(
      'INSERT INTO cinema_halls (name, capacity, description) VALUES (?, ?, ?)',
      [name, parseInt(capacity), description || '']
    );
    res.json({ message: 'Sala dodana', id: result.insertId });
  } catch (e) {
    console.error('Add hall error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Edytuj salę
router.put('/halls/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { name, capacity, description } = req.body;
    const [result] = await pool.query(
      'UPDATE cinema_halls SET name = ?, capacity = ?, description = ? WHERE id = ?',
      [name, parseInt(capacity), description || '', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Sala nie znaleziona' });
    res.json({ message: 'Sala zaktualizowana' });
  } catch (e) {
    console.error('Update hall error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

// Usuń salę
router.delete('/halls/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM cinema_halls WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Sala nie znaleziona' });
    res.json({ message: 'Sala usunięta' });
  } catch (e) {
    console.error('Delete hall error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

export default router;