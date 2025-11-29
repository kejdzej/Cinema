import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Proste rekomendacje na podstawie historii użytkownika
router.get("/", authRequired, async (req, res) => {
  try {
    // Pobierz filmy które użytkownik już oglądał
    const [watched] = await pool.query(
      `
      SELECT DISTINCT m.id, m.title, m.description, m.duration
      FROM tickets t
      JOIN sessions s ON t.session_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE t.user_id = ?
    `,
      [req.user.id]
    );

    // Jeśli użytkownik nie oglądał żadnych filmów, pokaż losowe
    if (watched.length === 0) {
      const [random] = await pool.query(
        `
        SELECT m.*, s.datetime, s.price, h.name as hall_name
        FROM movies m
        JOIN sessions s ON s.movie_id = m.id
        LEFT JOIN cinema_halls h ON s.hall_id = h.id
        WHERE s.datetime >= NOW()
        ORDER BY RAND()
        LIMIT 3
      `
      );
      return res.json({ 
        type: "random",
        message: "Oto nasze rekomendacje dla Ciebie:",
        movies: random 
      });
    }

    // Znajdź podobne filmy (te które użytkownik jeszcze nie oglądał)
    const watchedIds = watched.map(w => w.id);
    const placeholders = watchedIds.map(() => '?').join(',');

    // Jeśli brak watchedIds, użyj pustej listy
    let recommendations = [];
    if (watchedIds.length > 0) {
      const [recRows] = await pool.query(
        `
        SELECT DISTINCT m.id, m.title, m.description, m.duration, m.poster, s.id as session_id, s.datetime, s.price, h.name as hall_name
        FROM movies m
        JOIN sessions s ON s.movie_id = m.id
        LEFT JOIN cinema_halls h ON s.hall_id = h.id
        WHERE s.datetime >= NOW()
          AND m.id NOT IN (${placeholders})
        ORDER BY s.datetime ASC
        LIMIT 5
      `,
        watchedIds
      );
      recommendations = recRows;
    } else {
      // Jeśli użytkownik nie oglądał żadnych filmów, pokaż losowe
      const [randomRows] = await pool.query(
        `
        SELECT DISTINCT m.id, m.title, m.description, m.duration, m.poster, s.id as session_id, s.datetime, s.price, h.name as hall_name
        FROM movies m
        JOIN sessions s ON s.movie_id = m.id
        LEFT JOIN cinema_halls h ON s.hall_id = h.id
        WHERE s.datetime >= NOW()
        ORDER BY RAND()
        LIMIT 5
      `
      );
      recommendations = randomRows;
    }

    // Jeśli brak rekomendacji, pokaż najbliższe seanse
    if (!recommendations || recommendations.length === 0) {
      const [upcoming] = await pool.query(
        `
        SELECT m.*, s.datetime, s.price, h.name as hall_name
        FROM movies m
        JOIN sessions s ON s.movie_id = m.id
        LEFT JOIN cinema_halls h ON s.hall_id = h.id
        WHERE s.datetime >= NOW()
        ORDER BY s.datetime ASC
        LIMIT 5
      `
      );
      return res.json({
        type: "upcoming",
        message: "Oto najbliższe seanse:",
        movies: upcoming
      });
    }

    res.json({
      type: watchedIds.length > 0 ? "recommended" : "random",
      message: watchedIds.length > 0 
        ? "Na podstawie Twojej historii ogladania, polecamy:"
        : "Oto nasze rekomendacje dla Ciebie:",
      watched: watched.length,
      movies: recommendations
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({ message: "Błąd generowania rekomendacji" });
  }
});

export default router;

