import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM movies ORDER BY id DESC');
    // Attach poster paths without changing DB schema
    const posterMap = {
      'interstellar': '/posters/interstellar.jpeg',
      'the matrix': '/posters/matrix.jpg',
      'matrix': '/posters/matrix.jpg',
      'gladiator': '/posters/gladiator.jpg',
      'oppenheimer': '/posters/oppenheimer.jpeg',
      'barbie': '/posters/barbie.jpg',
      'venom': '/posters/venom.jpg',
      'dragon': '/posters/dragon.jpg',
      'aladdin': '/posters/aladdin.jpg',
      'lilo & stitch': '/posters/lilo-stitch.jpg',
      'minecraft': '/posters/minecraft.jpg',
      'marvel': '/posters/marvel.jpg'
    };
    const withPosters = rows.map(m => ({
      ...m,
      poster: posterMap[(m.title || '').toLowerCase()] || '/posters/popcorn.jpg'
    }));
    res.json(withPosters);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
