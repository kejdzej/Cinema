const express = require('express');
const { getRows, getRow, query } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/showtimes
router.get('/', async (req, res) => {
  try {
    const { date, filmId, roomId, city } = req.query;
    
    let whereConditions = ['s.starts_at >= NOW()'];
    let params = [];
    let paramIndex = 1;

    // Filter by date
    if (date) {
      whereConditions.push(`DATE(s.starts_at) = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    }

    // Filter by film
    if (filmId) {
      whereConditions.push(`s.film_id = $${paramIndex}`);
      params.push(filmId);
      paramIndex++;
    }

    // Filter by room
    if (roomId) {
      whereConditions.push(`s.room_id = $${paramIndex}`);
      params.push(roomId);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const showtimes = await getRows(`
      SELECT 
        s.id,
        s.starts_at,
        s.base_price_cents,
        s.language,
        s.format,
        s.created_at,
        f.id as film_id,
        f.title as film_title,
        f.duration_min,
        f.age_rating,
        f.poster_url,
        r.id as room_id,
        r.name as room_name
      FROM showtimes s
      JOIN films f ON s.film_id = f.id
      JOIN rooms r ON s.room_id = r.id
      ${whereClause}
      ORDER BY s.starts_at ASC
    `, params);

    res.json({ showtimes });
  } catch (error) {
    logger.error('Get showtimes failed:', error);
    res.status(500).json({ error: 'Failed to get showtimes' });
  }
});

// GET /api/showtimes/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const showtime = await getRow(`
      SELECT 
        s.id,
        s.starts_at,
        s.base_price_cents,
        s.language,
        s.format,
        s.created_at,
        f.id as film_id,
        f.title as film_title,
        f.description as film_description,
        f.duration_min,
        f.age_rating,
        f.poster_url,
        r.id as room_id,
        r.name as room_name,
        r.total_rows,
        r.total_cols
      FROM showtimes s
      JOIN films f ON s.film_id = f.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.id = $1
    `, [id]);

    if (!showtime) {
      return res.status(404).json({ error: 'Showtime not found' });
    }

    res.json({ showtime });
  } catch (error) {
    logger.error('Get showtime failed:', error);
    res.status(500).json({ error: 'Failed to get showtime' });
  }
});

// GET /api/showtimes/:id/seats
router.get('/:id/seats', async (req, res) => {
  try {
    const { id } = req.params;

    // Get showtime and room info
    const showtime = await getRow(`
      SELECT 
        s.id,
        s.starts_at,
        s.base_price_cents,
        r.id as room_id,
        r.name as room_name,
        r.total_rows,
        r.total_cols
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      WHERE s.id = $1
    `, [id]);

    if (!showtime) {
      return res.status(404).json({ error: 'Showtime not found' });
    }

    // Get all seats for the room
    const seats = await getRows(`
      SELECT 
        s.id,
        s.row_label,
        s.seat_number,
        s.type,
        s.is_active
      FROM seats s
      WHERE s.room_id = $1 AND s.is_active = true
      ORDER BY s.row_label, s.seat_number
    `, [showtime.room_id]);

    // Get booked seats for this showtime
    const bookedSeats = await getRows(`
      SELECT 
        bs.seat_id,
        b.status
      FROM booking_seats bs
      JOIN bookings b ON bs.booking_id = b.id
      WHERE bs.showtime_id = $1 
        AND b.status IN ('reserved', 'paid')
        AND (b.reserved_until IS NULL OR b.reserved_until > NOW())
    `, [id]);

    // Create a map of booked seats
    const bookedSeatsMap = {};
    bookedSeats.forEach(booking => {
      bookedSeatsMap[booking.seat_id] = booking.status;
    });

    // Add status to each seat
    const seatsWithStatus = seats.map(seat => ({
      ...seat,
      status: bookedSeatsMap[seat.id] || 'available'
    }));

    res.json({
      room: {
        id: showtime.room_id,
        name: showtime.room_name,
        totalRows: showtime.total_rows,
        totalCols: showtime.total_cols
      },
      seats: seatsWithStatus
    });
  } catch (error) {
    logger.error('Get seats failed:', error);
    res.status(500).json({ error: 'Failed to get seats' });
  }
});

// POST /api/showtimes/:id/reserve
router.post('/:id/reserve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { seats } = req.body;
    const userId = req.user.id;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'Seats array is required' });
    }

    // Get showtime info
    const showtime = await getRow(`
      SELECT id, starts_at, base_price_cents
      FROM showtimes 
      WHERE id = $1
    `, [id]);

    if (!showtime) {
      return res.status(404).json({ error: 'Showtime not found' });
    }

    // Check if showtime is in the future
    if (new Date(showtime.starts_at) <= new Date()) {
      return res.status(400).json({ error: 'Cannot reserve seats for past showtime' });
    }

    // Check if seats are available
    const bookedSeats = await getRows(`
      SELECT bs.seat_id
      FROM booking_seats bs
      JOIN bookings b ON bs.booking_id = b.id
      WHERE bs.showtime_id = $1 
        AND bs.seat_id = ANY($2)
        AND b.status IN ('reserved', 'paid')
        AND (b.reserved_until IS NULL OR b.reserved_until > NOW())
    `, [id, seats]);

    if (bookedSeats.length > 0) {
      return res.status(409).json({ 
        error: 'Some seats are already taken',
        takenSeats: bookedSeats.map(s => s.seat_id)
      });
    }

    // Calculate total price
    const totalPrice = seats.length * showtime.base_price_cents;

    // Create booking with 10-minute reservation
    const reservedUntil = new Date();
    reservedUntil.setMinutes(reservedUntil.getMinutes() + 10);

    const bookingResult = await query(`
      INSERT INTO bookings (user_id, showtime_id, status, total_cents, reserved_until)
      VALUES ($1, $2, 'reserved', $3, $4)
      RETURNING id
    `, [userId, id, totalPrice, reservedUntil]);

    const bookingId = bookingResult.rows[0].id;

    // Create booking seats
    for (const seatId of seats) {
      await query(`
        INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price_cents)
        VALUES ($1, $2, $3, $4)
      `, [bookingId, id, seatId, showtime.base_price_cents]);
    }

    logger.info('Seats reserved successfully', { 
      bookingId, 
      showtimeId: id, 
      seats, 
      userId 
    });

    res.status(201).json({
      message: 'Seats reserved successfully',
      bookingId,
      reservedUntil: reservedUntil.toISOString(),
      totalPrice,
      seats
    });
  } catch (error) {
    logger.error('Reserve seats failed:', error);
    res.status(500).json({ error: 'Failed to reserve seats' });
  }
});

module.exports = router;
