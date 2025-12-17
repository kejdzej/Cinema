import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Darmowa funkcja do tłumaczenia tekstu na polski (MyMemory API - bez klucza)
async function translateToPolish(text) {
  if (!text || text === 'N/A') {
    return text;
  }

  try {
    const encodedText = encodeURIComponent(text);
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|pl`
    );
    const data = await response.json();

    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (error) {
    console.error('Translation error:', error);
  }

  return text; // Zwróć oryginalny tekst jeśli tłumaczenie nie powiodło się
}

// OMDb API helper
async function fetchOMDbData(imdb_id) {
  if (!imdb_id || !process.env.OMDB_API_KEY || process.env.OMDB_API_KEY === 'YOUR_KEY_HERE') {
    return null;
  }

  try {
    const response = await fetch(
      `http://www.omdbapi.com/?i=${imdb_id}&apikey=${process.env.OMDB_API_KEY}`
    );
    const data = await response.json();

    if (data.Response === "True") {
      // Tłumacz opis i nagrody na polski
      const [plotPL, awardsPL] = await Promise.all([
        data.Plot && data.Plot !== 'N/A' ? translateToPolish(data.Plot) : data.Plot,
        data.Awards && data.Awards !== 'N/A' ? translateToPolish(data.Awards) : data.Awards
      ]);

      return {
        imdbRating: data.imdbRating,
        imdbVotes: data.imdbVotes,
        rated: data.Rated,
        runtime: data.Runtime,
        genre: data.Genre,
        director: data.Director,
        actors: data.Actors,
        plot: plotPL,
        awards: awardsPL,
        poster: data.Poster !== 'N/A' ? data.Poster : null,
        metascore: data.Metascore,
        boxOffice: data.BoxOffice
      };
    }
  } catch (error) {
    console.error('OMDb API error:', error);
  }

  return null;
}

// ✅ Поиск фильмов
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const [rows] = await pool.query(
      "SELECT id, title, poster, description FROM movies WHERE title LIKE ? LIMIT 10",
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Błąd wyszukiwania" });
  }
});

// podstawowy trasa filmow
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM movies ORDER BY id DESC");

    const posterMap = {
      "interstellar": "/posters/interstellar.jpeg",
      "the matrix": "/posters/matrix.jpg",
      "matrix": "/posters/matrix.jpg",
      "gladiator": "/posters/gladiator.jpg",
      "oppenheimer": "/posters/oppenheimer.jpeg",
      "barbie": "/posters/barbie.jpg",
      "venom": "/posters/venom.jpg",
      "dragon": "/posters/dragon.jpg",
      "aladdin": "/posters/aladdin.jpg",
      "lilo & stitch": "/posters/lilo-stitch.jpg",
      "minecraft": "/posters/minecraft.jpg",
      "marvel": "/posters/marvel.jpg",
    };

    // ✅ NAPRAWIONA LOGIKA POSTER:
    // 1. Użyj poster z bazy danych jeśli istnieje
    // 2. Jeśli nie - użyj posterMap
    // 3. Jeśli nie ma w posterMap - użyj placeholder
    const withPosters = rows.map((m) => ({
      ...m,
      poster: m.poster || posterMap[(m.title || "").toLowerCase()] || "/posters/placeholder.jpg",
    }));

    res.json(withPosters);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// pojedynczy film z pełnymi informacjami
router.get("/:id", async (req, res) => {
  try {
    // Pobierz film z bazy
    const [rows] = await pool.query("SELECT * FROM movies WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Film nie znaleziony" });

    const movie = rows[0];

    // Pobierz seanse dla tego filmu
    const [sessions] = await pool.query(
      `SELECT s.id, s.datetime, s.price, s.format,
              h.name as hall_name, h.capacity as hall_capacity, h.description as hall_description
       FROM sessions s
       LEFT JOIN cinema_halls h ON s.hall_id = h.id
       WHERE s.movie_id = ? AND s.datetime > NOW()
       ORDER BY s.datetime ASC`,
      [req.params.id]
    );

    // Pobierz dane z OMDb jeśli mamy imdb_id
    let omdbData = null;
    if (movie.imdb_id) {
      omdbData = await fetchOMDbData(movie.imdb_id);
    }

    // Zwróć wszystko razem
    res.json({
      ...movie,
      sessions: sessions || [],
      omdb: omdbData,
      hasSessions: sessions.length > 0
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;