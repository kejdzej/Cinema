const express = require('express');
const router = express.Router();

// TODO: Implement AI routes
// GET /api/ai/recommendations
// POST /api/ai/chat

router.get('/recommendations', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

router.post('/chat', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
