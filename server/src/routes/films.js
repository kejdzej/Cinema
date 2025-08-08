const express = require('express');
const { getRows, getRow } = require('../database/connection');
const { logger } = require('../utils/logger');

const router = express.Router();

// GET /api/films
router.get('/', async (req, res) => {
  try {
    logger.info('Getting films...');
    
    const films = await getRows(`
      SELECT 
        id,
        title,
        description,
        genre,
        director,
        actors,
        duration_min,
        premiere_date,
        age_rating,
        poster_url,
        created_at
      FROM films
      ORDER BY premiere_date DESC, title ASC
    `);

    logger.info(`Found ${films.length} films`);
    
    res.json({
      films,
      pagination: {
        page: 1,
        limit: 20,
        total: films.length,
        pages: 1
      }
    });
  } catch (error) {
    logger.error('Get films failed:', error);
    res.status(500).json({ error: 'Failed to get films', details: error.message });
  }
});

// GET /api/films/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const film = await getRow(`
      SELECT 
        id,
        title,
        description,
        genre,
        director,
        actors,
        duration_min,
        premiere_date,
        age_rating,
        poster_url,
        created_at
      FROM films 
      WHERE id = $1
    `, [id]);

    if (!film) {
      return res.status(404).json({ error: 'Film not found' });
    }

    res.json({ film });
  } catch (error) {
    logger.error('Get film failed:', error);
    res.status(500).json({ error: 'Failed to get film' });
  }
});

module.exports = router;
