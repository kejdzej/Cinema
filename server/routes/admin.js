import { Router } from 'express';
import { pool } from '../db.js';
import { adminRequired } from '../middleware/admin.js';
import { authRequired } from '../middleware/auth.js'; // DODANY IMPORT
import { ensureNewsTable } from './news.js';

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
    const { title, description, duration, poster, trailer_url, genre, director, cast, imdb_id, release_year } = req.body;
    if (!title || !duration) return res.status(400).json({ message: 'Tytuł i czas trwania są wymagane' });

    const [result] = await pool.query(
      'INSERT INTO movies (title, description, duration, poster, trailer_url, genre, director, cast, imdb_id, release_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title,
        description || '',
        parseInt(duration),
        poster || '',
        trailer_url || null,
        genre || null,
        director || null,
        cast || null,
        imdb_id || null,
        release_year ? parseInt(release_year) : null
      ]
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
    const { title, description, duration, poster, trailer_url, genre, director, cast, imdb_id, release_year } = req.body;
    const [result] = await pool.query(
      'UPDATE movies SET title = ?, description = ?, duration = ?, poster = ?, trailer_url = ?, genre = ?, director = ?, cast = ?, imdb_id = ?, release_year = ? WHERE id = ?',
      [
        title,
        description,
        parseInt(duration),
        poster,
        trailer_url || null,
        genre || null,
        director || null,
        cast || null,
        imdb_id || null,
        release_year ? parseInt(release_year) : null,
        req.params.id
      ]
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
    const { movie_id, datetime, price, hall_id, format } = req.body;
    
    console.log('[ADD SESSION] Request body:', { movie_id, datetime, price, hall_id, format, priceType: typeof price });
    
    if (!movie_id || !datetime) {
      return res.status(400).json({ message: 'Film i data są wymagane' });
    }
    
    // Walidacja ceny - bardziej elastyczna
    let priceValue;
    if (price === null || price === undefined || price === '') {
      return res.status(400).json({ message: 'Cena jest wymagana' });
    }
    
    if (typeof price === 'string') {
      // Usuń wszystkie znaki oprócz cyfr, kropki i przecinka
      const cleanedPrice = price.replace(/[^\d.,]/g, '').replace(',', '.');
      priceValue = parseFloat(cleanedPrice);
    } else if (typeof price === 'number') {
      priceValue = price;
    } else {
      return res.status(400).json({ message: 'Nieprawidłowy format ceny' });
    }
    
    console.log('[ADD SESSION] Parsed price:', priceValue);
    
    if (isNaN(priceValue) || priceValue <= 0) {
      return res.status(400).json({ message: `Nieprawidłowa cena: ${price}. Wprowadź poprawną liczbę większą od 0.` });
    }

    // Walidacja formatu
    const validFormat = (format === '2D' || format === '3D') ? format : '2D';
    
    // Sprawdź czy kolumna format istnieje
    try {
      console.log('[ADD SESSION] Executing query with format');
      const [result] = await pool.query(
        'INSERT INTO sessions (movie_id, datetime, price, hall_id, format) VALUES (?, ?, ?, ?, ?)',
        [parseInt(movie_id), datetime, priceValue, hall_id || null, validFormat]
      );
      console.log('[ADD SESSION] Success, ID:', result.insertId);
      res.json({ message: 'Seans dodany', id: result.insertId });
    } catch (formatError) {
      console.error('[ADD SESSION] Format error:', formatError.code, formatError.message);
      // Jeśli błąd związany z kolumną format, spróbuj bez niej
      if (formatError.code === 'ER_BAD_FIELD_ERROR' && formatError.sqlMessage?.includes('format')) {
        console.warn('Kolumna format nie istnieje, dodawanie bez formatu');
        const [result] = await pool.query(
          'INSERT INTO sessions (movie_id, datetime, price, hall_id) VALUES (?, ?, ?, ?)',
          [parseInt(movie_id), datetime, priceValue, hall_id || null]
        );
        res.json({ message: 'Seans dodany (bez formatu - wykonaj migrację SQL)', id: result.insertId });
      } else {
        throw formatError;
      }
    }
  } catch (e) {
    console.error('[ADD SESSION] Full error:', e);
    console.error('[ADD SESSION] Error stack:', e.stack);
    res.status(500).json({ message: 'Błąd serwera', error: e.message, code: e.code });
  }
});

// Edytuj seans
router.put('/sessions/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { movie_id, datetime, price, hall_id, format } = req.body;
    
    console.log('[UPDATE SESSION] Request body:', { movie_id, datetime, price, hall_id, format, priceType: typeof price });
    
    // Walidacja podstawowych pól
    if (!movie_id || !datetime) {
      return res.status(400).json({ message: 'Film i data są wymagane' });
    }
    
    // Walidacja ceny - bardziej elastyczna
    let priceValue;
    if (price === null || price === undefined || price === '') {
      return res.status(400).json({ message: 'Cena jest wymagana' });
    }
    
    if (typeof price === 'string') {
      // Usuń wszystkie znaki oprócz cyfr, kropki i przecinka
      const cleanedPrice = price.replace(/[^\d.,]/g, '').replace(',', '.');
      priceValue = parseFloat(cleanedPrice);
    } else if (typeof price === 'number') {
      priceValue = price;
    } else {
      return res.status(400).json({ message: 'Nieprawidłowy format ceny' });
    }
    
    console.log('[UPDATE SESSION] Parsed price:', priceValue);
    
    if (isNaN(priceValue) || priceValue <= 0) {
      return res.status(400).json({ message: `Nieprawidłowa cena: ${price}. Wprowadź poprawną liczbę większą od 0.` });
    }
    
    // Walidacja formatu
    const validFormat = (format === '2D' || format === '3D') ? format : '2D';
    
    // Sprawdź czy kolumna format istnieje, jeśli nie - użyj UPDATE bez format
    let query, params;
    try {
      // Spróbuj z format
      query = 'UPDATE sessions SET movie_id = ?, datetime = ?, price = ?, hall_id = ?, format = ? WHERE id = ?';
      params = [parseInt(movie_id), datetime, priceValue, hall_id || null, validFormat, parseInt(req.params.id)];
      console.log('[UPDATE SESSION] Executing query with format:', query, params);
      const [result] = await pool.query(query, params);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Seans nie znaleziony' });
      console.log('[UPDATE SESSION] Success');
      res.json({ message: 'Seans zaktualizowany' });
    } catch (formatError) {
      console.error('[UPDATE SESSION] Format error:', formatError.code, formatError.message);
      // Jeśli błąd związany z kolumną format, spróbuj bez niej
      if (formatError.code === 'ER_BAD_FIELD_ERROR' && formatError.sqlMessage?.includes('format')) {
        console.warn('Kolumna format nie istnieje, aktualizacja bez formatu');
        query = 'UPDATE sessions SET movie_id = ?, datetime = ?, price = ?, hall_id = ? WHERE id = ?';
        params = [parseInt(movie_id), datetime, priceValue, hall_id || null, parseInt(req.params.id)];
        console.log('[UPDATE SESSION] Executing query without format:', query, params);
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Seans nie znaleziony' });
        res.json({ message: 'Seans zaktualizowany (bez formatu - wykonaj migrację SQL)' });
      } else {
        throw formatError;
      }
    }
  } catch (e) {
    console.error('[UPDATE SESSION] Full error:', e);
    console.error('[UPDATE SESSION] Error stack:', e.stack);
    res.status(500).json({ message: 'Błąd serwera', error: e.message, code: e.code });
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

// ========== ZARZĄDZANIE AKTUALNOŚCIAMI ==========

router.get('/news', authRequired, adminRequired, async (req, res) => {
  try {
    await ensureNewsTable();
    const [rows] = await pool.query(
      `SELECT id, title, body, highlight, published_at, created_at, updated_at
       FROM news
       ORDER BY COALESCE(published_at, created_at) DESC, id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('Admin news list error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

router.post('/news', authRequired, adminRequired, async (req, res) => {
  try {
    await ensureNewsTable();
    const { title, body, highlight, published_at } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ message: 'Tytuł i treść są wymagane' });
    }
    const highlightValue = highlight ? 1 : 0;
    const publishedAtValue = published_at ? new Date(published_at) : null;
    const publishedAtFinal =
      publishedAtValue && !isNaN(publishedAtValue.getTime())
        ? publishedAtValue.toISOString().slice(0, 19).replace('T', ' ')
        : null;

    const [result] = await pool.query(
      'INSERT INTO news (title, body, highlight, published_at) VALUES (?, ?, ?, ?)',
      [String(title), String(body), highlightValue, publishedAtFinal]
    );
    res.json({ message: 'Aktualność dodana', id: result.insertId });
  } catch (e) {
    console.error('Admin news add error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

router.put('/news/:id', authRequired, adminRequired, async (req, res) => {
  try {
    await ensureNewsTable();
    const { title, body, highlight, published_at } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ message: 'Tytuł i treść są wymagane' });
    }
    const highlightValue = highlight ? 1 : 0;
    const publishedAtValue = published_at ? new Date(published_at) : null;
    const publishedAtFinal =
      publishedAtValue && !isNaN(publishedAtValue.getTime())
        ? publishedAtValue.toISOString().slice(0, 19).replace('T', ' ')
        : null;

    const [result] = await pool.query(
      'UPDATE news SET title = ?, body = ?, highlight = ?, published_at = ? WHERE id = ?',
      [String(title), String(body), highlightValue, publishedAtFinal, parseInt(req.params.id)]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Aktualność nie znaleziona' });
    res.json({ message: 'Aktualność zaktualizowana' });
  } catch (e) {
    console.error('Admin news update error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

router.delete('/news/:id', authRequired, adminRequired, async (req, res) => {
  try {
    await ensureNewsTable();
    const [result] = await pool.query('DELETE FROM news WHERE id = ?', [parseInt(req.params.id)]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Aktualność nie znaleziona' });
    res.json({ message: 'Aktualność usunięta' });
  } catch (e) {
    console.error('Admin news delete error:', e);
    res.status(500).json({ message: 'Błąd serwera', error: e.message });
  }
});

export default router;