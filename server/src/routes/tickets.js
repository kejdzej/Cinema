const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query, getRow, getRows } = require('../database/connection');
const logger = require('../utils/logger');

// GET /api/tickets/:ticketId - Get ticket details
router.get('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await getRow(`
      SELECT 
        t.id,
        t.qr_code,
        t.status,
        t.created_at,
        s.row_label,
        s.seat_number,
        s.type as seat_type,
        r.name as room_name,
        sh.starts_at,
        f.title as film_title,
        f.duration_min,
        b.id as booking_id,
        u.email as user_email
      FROM tickets t
      JOIN booking_seats bs ON t.booking_id = bs.booking_id AND t.seat_id = bs.seat_id
      JOIN seats s ON t.seat_id = s.id
      JOIN bookings b ON t.booking_id = b.id
      JOIN showtimes sh ON b.showtime_id = sh.id
      JOIN films f ON sh.film_id = f.id
      JOIN rooms r ON sh.room_id = r.id
      JOIN users u ON b.user_id = u.id
      WHERE t.id = $1
    `, [ticketId]);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ ticket });
  } catch (error) {
    logger.error('Get ticket failed:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

// POST /api/tickets/verify - Verify ticket by QR code
router.post('/verify', async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ error: 'QR code is required' });
    }

    const ticket = await getRow(`
      SELECT 
        t.id,
        t.status,
        t.created_at,
        s.row_label,
        s.seat_number,
        s.type as seat_type,
        r.name as room_name,
        sh.starts_at,
        f.title as film_title,
        b.status as booking_status,
        u.email as user_email
      FROM tickets t
      JOIN booking_seats bs ON t.booking_id = bs.booking_id AND t.seat_id = bs.seat_id
      JOIN seats s ON t.seat_id = s.id
      JOIN bookings b ON t.booking_id = b.id
      JOIN showtimes sh ON b.showtime_id = sh.id
      JOIN films f ON sh.film_id = f.id
      JOIN rooms r ON sh.room_id = r.id
      JOIN users u ON b.user_id = u.id
      WHERE t.qr_code = $1
    `, [qrCode]);

    if (!ticket) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    // Check if ticket is valid
    if (ticket.status !== 'active') {
      return res.status(400).json({ 
        error: 'Ticket is not active',
        status: ticket.status 
      });
    }

    if (ticket.booking_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Booking is not paid',
        bookingStatus: ticket.booking_status 
      });
    }

    // Check if showtime is today
    const showtimeDate = new Date(ticket.starts_at);
    const today = new Date();
    const isToday = showtimeDate.toDateString() === today.toDateString();

    if (!isToday) {
      return res.status(400).json({ 
        error: 'Ticket is not valid for today',
        showtimeDate: showtimeDate.toISOString()
      });
    }

    // Mark ticket as used (optional - for tracking)
    await query(`
      UPDATE tickets 
      SET status = 'used', used_at = NOW()
      WHERE id = $1
    `, [ticket.id]);

    logger.info('Ticket verified successfully', { 
      ticketId: ticket.id, 
      qrCode,
      filmTitle: ticket.film_title,
      seat: `${ticket.row_label}${ticket.seat_number}`
    });

    res.json({
      message: 'Ticket verified successfully',
      ticket: {
        id: ticket.id,
        filmTitle: ticket.film_title,
        roomName: ticket.room_name,
        seat: `${ticket.row_label}${ticket.seat_number}`,
        seatType: ticket.seat_type,
        showtime: ticket.starts_at,
        userEmail: ticket.user_email
      }
    });
  } catch (error) {
    logger.error('Ticket verification failed:', error);
    res.status(500).json({ error: 'Ticket verification failed' });
  }
});

// GET /api/tickets/:ticketId/pdf - Generate PDF ticket (placeholder)
router.get('/:ticketId/pdf', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await getRow(`
      SELECT 
        t.id,
        t.qr_code,
        s.row_label,
        s.seat_number,
        s.type as seat_type,
        r.name as room_name,
        sh.starts_at,
        f.title as film_title,
        f.duration_min,
        b.id as booking_id
      FROM tickets t
      JOIN booking_seats bs ON t.booking_id = bs.booking_id AND t.seat_id = bs.seat_id
      JOIN seats s ON t.seat_id = s.id
      JOIN bookings b ON t.booking_id = b.id
      JOIN showtimes sh ON b.showtime_id = sh.id
      JOIN films f ON sh.film_id = f.id
      JOIN rooms r ON sh.room_id = r.id
      WHERE t.id = $1 AND b.user_id = $2
    `, [ticketId, userId]);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // For now, return ticket data as JSON
    // In production, this would generate a PDF file
    res.json({
      message: 'PDF generation not implemented yet',
      ticketData: {
        id: ticket.id,
        qrCode: ticket.qr_code,
        filmTitle: ticket.film_title,
        roomName: ticket.room_name,
        seat: `${ticket.row_label}${ticket.seat_number}`,
        seatType: ticket.seat_type,
        showtime: ticket.starts_at,
        duration: ticket.duration_min
      }
    });
  } catch (error) {
    logger.error('PDF generation failed:', error);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

module.exports = router;
