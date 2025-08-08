const express = require('express');
const router = express.Router();

// TODO: Implement admin routes
// CRUD /api/admin/films
// CRUD /api/admin/rooms
// CRUD /api/admin/showtimes
// GET /api/admin/reports/sales

router.get('/films', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

router.get('/rooms', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

router.get('/showtimes', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

router.get('/reports/sales', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
