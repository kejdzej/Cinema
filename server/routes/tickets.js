import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import QRCode from "qrcode";

const router = Router();

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
      "SELECT price FROM sessions WHERE id = ?",
      [session_id]
    );
    if (!session) return res.status(404).json({ message: "Session not found" });

    const totalPrice = session.price * seatArr.length;

    // tworzymy bilet
    const [result] = await pool.query(
      "INSERT INTO tickets (session_id, user_id, seats, price) VALUES (?, ?, ?, ?)",
      [session_id, req.user.id, seatStr, totalPrice]
    );

    // **Начисляем 100 пунктов за покупку**
    const pointsToAdd = 100;
    await pool.query(
      "UPDATE users SET points = points + ? WHERE id = ?",
      [pointsToAdd, req.user.id]
    );

    // Записываем историю начисления очков
    await pool.query(
  "INSERT INTO loyalty_history (user_id, change_amount, description) VALUES (?, ?, ?)",
  [req.user.id, pointsToAdd, 'Zakup biletu']
);


    res.json({
      ticket_id: result.insertId,
      amount: totalPrice,
      status: "confirmed",
      pointsAdded: pointsToAdd
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
      SELECT t.id, t.seats, t.price, t.created_at, s.datetime, m.title
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN movies m ON m.id = s.movie_id
      WHERE t.user_id = ?
      ORDER BY s.datetime DESC
    `,
      [req.user.id]
    );

    // Добавляем QR-код к каждому билету
    for (let ticket of rows) {
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
      SELECT t.*, s.datetime, m.title
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN movies m ON m.id = s.movie_id
      WHERE t.id = ? AND t.user_id = ?
    `,
      [req.params.id, req.user.id]
    );

    if (!tickets.length) {
      return res.status(404).json({ message: "Bilet nie znaleziony" });
    }

    const ticket = tickets[0];

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

    // Zwróć punkty lojalnościowe (100 punktów za bilet)
    const pointsToReturn = 100;
    await pool.query(
      "UPDATE users SET points = points - ? WHERE id = ? AND points >= ?",
      [pointsToReturn, req.user.id, pointsToReturn]
    );

    // Zapisz w historii
    await pool.query(
      "INSERT INTO loyalty_history (user_id, change_amount, description) VALUES (?, ?, ?)",
      [req.user.id, -pointsToReturn, 'Anulowanie biletu']
    );

    // Jeśli była płatność, oznacz jako refunded
    if (payments.length > 0) {
      await pool.query(
        "UPDATE payments SET status = 'refunded' WHERE booking_id = ?",
        [id]
      );
    }

    res.json({ 
      message: "Bilet anulowany pomyślnie",
      pointsReturned: pointsToReturn,
      refundRequired: payments.length > 0
    });
  } catch (error) {
    console.error("Cancel ticket error:", error);
    res.status(500).json({ message: "Błąd anulowania biletu" });
  }
});

export default router;
