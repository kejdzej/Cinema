import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import Stripe from 'stripe';

// Inicjalizacja Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not set in environment variables');
  console.error('Please add STRIPE_SECRET_KEY to your .env file');
}

const stripe = new Stripe(stripeSecretKey || 'sk_test_dummy_key');

const router = Router();

// zakup biletu
router.post('/purchase', authRequired, async (req, res) => {
  try {
    const { session_id, seats } = req.body; // seats: array or string?
    if (!session_id || !seats) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // 
    const seatArr = Array.isArray(seats) ? seats : String(seats).split(',');
    const seatStr = seatArr.join(',');

    // cena za 1 miejsce
    const [[session]] = await pool.query(
      'SELECT price FROM sessions WHERE id = ?',
      [session_id]
    );
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    
    const totalPrice = session.price * seatArr.length;

    // zapis biletu
    await pool.query(
      'INSERT INTO tickets (session_id, user_id, seats, price) VALUES (?, ?, ?, ?)',
      [session_id, req.user.id, seatStr, totalPrice]
    );

    // Pobierz ID utworzonego biletu
    const [[ticket]] = await pool.query(
      'SELECT LAST_INSERT_ID() as ticket_id'
    );

    res.json({ 
      message: 'Tickets purchased',
      ticket_id: ticket?.ticket_id,
      amount: totalPrice
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// moje bilety
router.get('/mine', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.seats, t.price, s.datetime, m.title
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN movies m ON m.id = s.movie_id
      WHERE t.user_id = ?
      ORDER BY s.datetime DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// wszystkie bilety (blokowanie)
router.get('/session/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT seats FROM tickets WHERE session_id = ?',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pobierz bilet po ID
router.get('/:id', authRequired, async (req, res) => {
  try {
    console.log('Getting ticket:', req.params.id, 'for user:', req.user.id);
    
    const [tickets] = await pool.query(`
      SELECT t.*, s.datetime, m.title, s.price as session_price
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN movies m ON m.id = s.movie_id
      WHERE t.id = ? AND t.user_id = ?
    `, [req.params.id, req.user.id]);
    
    console.log('Ticket query result:', tickets);
    
    if (!tickets.length) {
      return res.status(404).json({ message: 'Bilet nie znaleziony' });
    }

    res.json(tickets[0]);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Błąd pobierania biletu' });
  }
});

// Płatność Stripe - utworzenie payment intent
router.post('/create-payment-intent', authRequired, async (req, res) => {
  try {
    const { ticket_id, amount } = req.body;
    
    console.log('📋 Creating payment intent for ticket:', ticket_id, 'amount:', amount);
    
    // Sprawdź czy klucz Stripe jest dostępny
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy_key') {
      console.error('❌ STRIPE_SECRET_KEY is not properly configured');
      return res.status(500).json({ message: 'Konfiguracja płatności nie jest kompletna. Sprawdź plik .env' });
    }
    
    // Sprawdź czy bilet należy do użytkownika
    const [tickets] = await pool.query(
      'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
      [ticket_id, req.user.id]
    );
    
    if (!tickets.length) {
      console.log('❌ Ticket not found or not owned by user');
      return res.status(404).json({ message: 'Bilet nie znaleziony' });
    }
    
    console.log('💳 Creating Stripe payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // w groszach
      currency: 'pln',
      metadata: { 
        ticket_id: ticket_id.toString(),
        user_id: req.user.id.toString()
      }
    });

    console.log('✅ Payment intent created:', paymentIntent.id);
    
    // Zapisz w bazie
    await pool.query(
      'INSERT INTO payments (booking_id, stripe_payment_id, amount) VALUES (?, ?, ?)',
      [ticket_id, paymentIntent.id, amount]
    );
    
    console.log('💾 Payment saved to database');

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    });
  } catch (error) {
    console.error('❌ Stripe error details:', error);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ message: 'Błąd płatności: ' + error.message });
  }
});

export default router;
