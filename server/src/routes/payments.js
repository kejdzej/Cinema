import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create PaymentIntent
router.post('/create-payment-intent', authRequired, async (req, res) => {
  try {
    const { amount, currency = 'pln', ticketId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        ticketId: ticketId ? String(ticketId) : '',
        userId: String(req.user?.id || ''),
      },
    });

    // Insert payment record as pending only if ticket exists (to satisfy FK)
    try {
      if (ticketId) {
        const [rows] = await pool.query('SELECT id FROM tickets WHERE id = ?', [ticketId]);
        if (rows.length) {
          await pool.query(
            'INSERT INTO payments (booking_id, amount, currency, status) VALUES (?, ?, ?, ?)',
            [ticketId, (amount / 100).toFixed(2), currency.toUpperCase(), 'pending']
          );
        } else {
          console.warn('Skipping payments insert: ticketId not found', ticketId);
        }
      } else {
        console.warn('Skipping payments insert: no ticketId provided');
      }
    } catch (dbErr) {
      // non-fatal: log and continue
      console.error('DB insert payment error', dbErr);
    }

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Create PI error', err);
    return res.status(500).json({ message: 'Payment initialization failed' });
  }
});

// Optional: confirm on server (usually not required with Elements)
router.post('/confirm-payment', authRequired, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'paymentIntentId required' });
    }

    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId);
    return res.json({ status: confirmed.status });
  } catch (err) {
    console.error('Confirm PI error', err);
    return res.status(500).json({ message: 'Payment confirmation failed' });
  }
});

export default router;


