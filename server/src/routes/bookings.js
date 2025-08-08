const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query, getRow, getRows } = require('../database/connection');
const logger = require('../utils/logger');

// GET /api/bookings/my - Get user's bookings
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await getRows(`
      SELECT 
        b.id,
        b.status,
        b.total_cents,
        b.created_at,
        b.reserved_until,
        s.starts_at,
        s.base_price_cents,
        f.title as film_title,
        f.poster_url,
        r.name as room_name,
        COUNT(bs.seat_id) as seat_count
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN films f ON s.film_id = f.id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN booking_seats bs ON b.id = bs.booking_id
      WHERE b.user_id = $1
      GROUP BY b.id, s.id, f.id, r.id
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json({ bookings });
  } catch (error) {
    logger.error('Get user bookings failed:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// POST /api/bookings/:bookingId/checkout - Finalize booking with payment
router.post('/:bookingId/checkout', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, paymentToken } = req.body;
    const userId = req.user.id;

    // Get booking details
    const booking = await getRow(`
      SELECT 
        b.id,
        b.status,
        b.total_cents,
        b.reserved_until,
        s.starts_at,
        s.id as showtime_id
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      WHERE b.id = $1 AND b.user_id = $2
    `, [bookingId, userId]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'paid') {
      return res.status(400).json({ error: 'Booking already paid' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is cancelled' });
    }

    // Check if reservation is still valid
    if (booking.reserved_until && new Date(booking.reserved_until) < new Date()) {
      return res.status(400).json({ error: 'Reservation expired' });
    }

    // Simulate payment processing
    // In production, this would integrate with Stripe/PayU/etc.
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for testing

    if (!paymentSuccess) {
      return res.status(402).json({ error: 'Payment failed' });
    }

    // Update booking status to paid
    await query(`
      UPDATE bookings 
      SET status = 'paid', reserved_until = NULL
      WHERE id = $1
    `, [bookingId]);

    // Create payment record
    await query(`
      INSERT INTO payments (
        booking_id, 
        amount_cents, 
        payment_method, 
        status, 
        transaction_id
      ) VALUES ($1, $2, $3, 'completed', $4)
    `, [
      bookingId, 
      booking.total_cents, 
      paymentMethod, 
      `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    ]);

    // Generate tickets
    const seats = await getRows(`
      SELECT 
        bs.seat_id,
        s.row_label,
        s.seat_number,
        s.type
      FROM booking_seats bs
      JOIN seats s ON bs.seat_id = s.id
      WHERE bs.booking_id = $1
    `, [bookingId]);

    const tickets = [];
    for (const seat of seats) {
      const ticketResult = await query(`
        INSERT INTO tickets (
          booking_id,
          seat_id,
          qr_code,
          status
        ) VALUES ($1, $2, $3, 'active')
        RETURNING id
      `, [
        bookingId,
        seat.seat_id,
        `QR_${bookingId}_${seat.seat_id}_${Date.now()}`
      ]);
      
      tickets.push({
        id: ticketResult.rows[0].id,
        seat: `${seat.row_label}${seat.seat_number}`,
        type: seat.type
      });
    }

    logger.info('Booking checkout completed', { 
      bookingId, 
      userId, 
      totalCents: booking.total_cents,
      ticketCount: tickets.length
    });

    res.json({
      message: 'Payment successful',
      bookingId,
      totalCents: booking.total_cents,
      tickets
    });
  } catch (error) {
    logger.error('Checkout failed:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// DELETE /api/bookings/:bookingId - Cancel booking
router.delete('/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await getRow(`
      SELECT id, status, reserved_until
      FROM bookings 
      WHERE id = $1 AND user_id = $2
    `, [bookingId, userId]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'paid') {
      return res.status(400).json({ error: 'Cannot cancel paid booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    // Check if reservation is still valid
    if (booking.reserved_until && new Date(booking.reserved_until) < new Date()) {
      return res.status(400).json({ error: 'Reservation already expired' });
    }

    // Cancel booking
    await query(`
      UPDATE bookings 
      SET status = 'cancelled'
      WHERE id = $1
    `, [bookingId]);

    logger.info('Booking cancelled', { bookingId, userId });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    logger.error('Cancel booking failed:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;
