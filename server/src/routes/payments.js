const express = require('express');
const router = express.Router();

// TODO: Implement payments routes
// POST /api/payments/webhook

router.post('/webhook', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
