import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

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

// pojedynczy film
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM movies WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Film nie znaleziony" });

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;