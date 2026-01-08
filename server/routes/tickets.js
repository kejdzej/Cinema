import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import QRCode from "qrcode";
import { BASE_POINTS_FOR_PURCHASE, FREE_TICKET_COST } from "./loyalty.js";
import { calculateTotalPrice, calculateNumericPrice as parseNumericPrice, detectHallType } from "../utils/pricingCalculator.js";

const router = Router();

const MIN_POINTS_PER_PURCHASE = BASE_POINTS_FOR_PURCHASE || 1;

const calculatePointsForAmount = (amount) => {
  const numeric = parseNumericPrice(amount);
  if (numeric <= 0) return 0;
  return Math.round(numeric); // 1 punkt = 1 złotówka
};

const markRewardTicket = (ticket) => {
  const isReward = ticket.status === "free" || Number(ticket.price) === 0;
  ticket.is_free = isReward;
  if (isReward) {
    ticket.reward_label = "Bilet lojalnościowy";
    ticket.price = 0;
  }
  return ticket;
};

// zakup biletu
router.post("/purchase", authRequired, async (req, res) => {
  try {
    const { session_id, seats } = req.body;
    if (!session_id || !seats) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const seatArr = Array.isArray(seats) ? seats : String(seats).split(",");
    const seatStr = seatArr.join(",");

    const [[session]] = await pool.query(
      "SELECT s.price, s.format, s.hall_id, h.name as hall_name, h.description as hall_description, h.capacity as hall_capacity FROM sessions s LEFT JOIN cinema_halls h ON s.hall_id = h.id WHERE s.id = ?",
      [session_id]
    );
    if (!session) return res.status(404).json({ message: "Session not found" });

    const hallInfo = {
      type: detectHallType(session.hall_name, session.hall_description),
      name: session.hall_name || '',
      capacity: parseInt(session.hall_capacity) || 40
    };

    const sessionPrice = parseNumericPrice(session.price);

    const totalPrice = calculateTotalPrice(seatArr, hallInfo, sessionPrice);

    console.log(`[PRICE CALC] Sala: ${hallInfo.name}, Type: ${hallInfo.type}, Capacity: ${hallInfo.capacity}, BasePrice: ${sessionPrice}, Seats: ${seatArr.join(', ')}, Total: ${totalPrice} zł`);

    const [result] = await pool.query(
      "INSERT INTO tickets (session_id, user_id, seats, price) VALUES (?, ?, ?, ?)",
      [session_id, req.user.id, seatStr, totalPrice]
    );

    const pointsToAdd = calculatePointsForAmount(totalPrice);
    await pool.query(
      "UPDATE users SET points = points + ? WHERE id = ?",
      [pointsToAdd, req.user.id]
    );
    const [[balanceRow]] = await pool.query(
      "SELECT points FROM users WHERE id = ?",
      [req.user.id]
    );
    const balanceAfter = balanceRow?.points || 0;

    await pool.query(
      "INSERT INTO loyalty_history (user_id, change_amount, description, points) VALUES (?, ?, ?, ?)",
      [req.user.id, pointsToAdd, "Zakup biletu", balanceAfter]
    );

    res.json({
      ticket_id: result.insertId,
      amount: totalPrice,
      status: "confirmed",
      pointsAdded: pointsToAdd,
      newBalance: balanceAfter
    });
  } catch (e) {
  console.error("PURCHASE ERROR:", e.sqlMessage || e);
  res.status(500).json({ message: e.sqlMessage || "Server error" });
}

});

// moje bilety
router.get("/mine", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT t.id, t.seats, t.price, t.status, t.created_at, t.session_id, s.datetime, s.format, s.price as session_price, s.hall_id,
             m.title, h.name as hall_name, h.description as hall_description, h.capacity as hall_capacity
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN movies m ON m.id = s.movie_id
      LEFT JOIN cinema_halls h ON s.hall_id = h.id
      WHERE t.user_id = ?
      ORDER BY s.datetime DESC
    `,
      [req.user.id]
    );

    // Przelicz cenę dla każdego biletu (na wypadek błędnych cen w bazie)
    for (let ticket of rows) {
      markRewardTicket(ticket);
      if (!ticket.is_free) {
        const seatArr = ticket.seats ? String(ticket.seats).split(',').map(s => s.trim()) : [];
        const hallInfo = {
          type: detectHallType(ticket.hall_name, ticket.hall_description),
          name: ticket.hall_name || '',
          capacity: parseInt(ticket.hall_capacity) || 40
        };
        const sessionPrice = parseNumericPrice(ticket.session_price);

        // Przelicz cenę używając wspólnego utility
        ticket.price = calculateTotalPrice(seatArr, hallInfo, sessionPrice);
      }
      
      // Добавляем QR-код к каждому билету
      ticket.qr = await QRCode.toDataURL(`ticket:${ticket.id}`);
    }

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// wszystkie bilety (blokowanie)
router.get("/session/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT seats FROM tickets WHERE session_id = ?",
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Pobierz bilet po ID
router.get("/:id", authRequired, async (req, res) => {
  try {
    const [tickets] = await pool.query(
      `
      SELECT t.*, t.session_id, s.datetime, s.format, s.price as session_price, s.hall_id,
             m.title, h.name as hall_name, h.description as hall_description, h.capacity as hall_capacity
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN movies m ON m.id = s.movie_id
      LEFT JOIN cinema_halls h ON s.hall_id = h.id
      WHERE t.id = ? AND t.user_id = ?
    `,
      [req.params.id, req.user.id]
    );

    if (!tickets.length) {
      return res.status(404).json({ message: "Bilet nie znaleziony" });
    }

    const ticket = markRewardTicket(tickets[0]);

    if (!ticket.is_free) {
      // Przelicz cenę (tak jak w /mine) - zawsze aktualna cena
      const seatArr = ticket.seats ? String(ticket.seats).split(',').map(s => s.trim()) : [];
      const hallInfo = {
        type: detectHallType(ticket.hall_name, ticket.hall_description),
        name: ticket.hall_name || '',
        capacity: parseInt(ticket.hall_capacity) || 40
      };
      const sessionPrice = parseNumericPrice(ticket.session_price);

      // Przelicz cenę używając wspólnego utility
      ticket.price = calculateTotalPrice(seatArr, hallInfo, sessionPrice);
    }

    // generowanie QR
    const qrData = `Ticket ID: ${ticket.id}, Film: ${ticket.title}, Miejsca: ${ticket.seats}, Data: ${ticket.datetime}`;
    ticket.qr = await QRCode.toDataURL(qrData);

    res.json(ticket);
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({ message: "Błąd pobierania biletu" });
  }
});

// Anuluj bilet (tylko przed seansem)
router.delete("/:id", authRequired, async (req, res) => {
  try {
    const { id } = req.params;

    // Pobierz bilet z datą seansu
    const [tickets] = await pool.query(
      `
      SELECT t.*, s.datetime, t.user_id
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      WHERE t.id = ? AND t.user_id = ?
    `,
      [id, req.user.id]
    );

    if (!tickets.length) {
      return res.status(404).json({ message: "Bilet nie znaleziony" });
    }

    const ticket = tickets[0];
    const sessionDate = new Date(ticket.datetime);
    const now = new Date();

    // Sprawdź czy seans jeszcze się nie odbył (min. 1 godzina przed)
    const hoursUntilSession = (sessionDate - now) / (1000 * 60 * 60);
    if (hoursUntilSession < 1) {
      return res.status(400).json({ 
        message: "Nie można anulować biletu. Seans rozpoczyna się za mniej niż 1 godzinę." 
      });
    }

    // Sprawdź czy płatność została zrealizowana
    const [payments] = await pool.query(
      "SELECT * FROM payments WHERE booking_id = ? AND status = 'paid'",
      [id]
    );

    // Usuń bilet
    await pool.query("DELETE FROM tickets WHERE id = ?", [id]);

    // Korekta punktów lojalnościowych
    const isRewardTicket = ticket.status === 'free' || Number(ticket.price) === 0;
    const pointsDelta = isRewardTicket
      ? FREE_TICKET_COST
      : -calculatePointsForAmount(ticket.price);

    if (pointsDelta !== 0) {
      await pool.query(
        "UPDATE users SET points = points + ? WHERE id = ?",
        [pointsDelta, req.user.id]
      );
      const [[balanceRow]] = await pool.query(
        "SELECT points FROM users WHERE id = ?",
        [req.user.id]
      );
      await pool.query(
        "INSERT INTO loyalty_history (user_id, change_amount, description, points) VALUES (?, ?, ?, ?)",
        [
          req.user.id,
          pointsDelta,
          isRewardTicket ? 'Zwrot punktów za darmowy bilet' : 'Korekta za anulowanie biletu',
          balanceRow?.points || 0
        ]
      );
    }

    // Jeśli była płatność, oznacz jako refunded
    if (payments.length > 0) {
      await pool.query(
        "UPDATE payments SET status = 'refunded' WHERE booking_id = ?",
        [id]
      );
    }

    res.json({ 
      message: "Bilet anulowany pomyślnie",
      pointsChange: pointsDelta,
      refundRequired: payments.length > 0
    });
  } catch (error) {
    console.error("Cancel ticket error:", error);
    res.status(500).json({ message: "Błąd anulowania biletu" });
  }
});

export default router;