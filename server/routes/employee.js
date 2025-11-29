import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Middleware - sprawdź czy użytkownik to pracownik lub admin
const employeeRequired = (req, res, next) => {
  if (req.user.role !== 'employee' && req.user.role !== 'admin') {
    return res.status(403).json({ message: "Brak uprawnień. Wymagana rola pracownika." });
  }
  next();
};

// Weryfikacja biletu przez QR kod
router.post("/tickets/verify", authRequired, employeeRequired, async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ message: "Brak danych QR" });
    }

    // Parsuj QR kod (format: TICKET:id|title|seats|datetime)
    const match = qrData.match(/TICKET:(\d+)\|/);
    if (!match) {
      return res.status(400).json({ message: "Nieprawidłowy format QR" });
    }

    const ticketId = parseInt(match[1]);

    // Pobierz bilet
    const [tickets] = await pool.query(
      `
      SELECT t.*, s.datetime, m.title, u.name as user_name, h.name as hall_name
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN movies m ON s.movie_id = m.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN cinema_halls h ON s.hall_id = h.id
      WHERE t.id = ?
    `,
      [ticketId]
    );

    if (!tickets.length) {
      return res.status(404).json({ message: "Bilet nie znaleziony" });
    }

    const ticket = tickets[0];
    const sessionDate = new Date(ticket.datetime);
    const now = new Date();

    // Sprawdź czy seans już się odbył
    if (now > sessionDate) {
      return res.status(400).json({ 
        message: "Seans już się odbył",
        ticket: ticket
      });
    }

    // Sprawdź czy seans jeszcze się nie rozpoczął (max 30 min przed)
    const minutesUntilSession = (sessionDate - now) / (1000 * 60);
    if (minutesUntilSession > 30) {
      return res.status(400).json({ 
        message: `Seans rozpocznie się za ${Math.round(minutesUntilSession)} minut. Weryfikacja możliwa 30 minut przed seansem.`,
        ticket: ticket
      });
    }

    res.json({
      message: "Bilet zweryfikowany pomyślnie",
      ticket: ticket,
      verified: true
    });
  } catch (error) {
    console.error("Verify ticket error:", error);
    res.status(500).json({ message: "Błąd weryfikacji biletu" });
  }
});

// Lista zamówień do obsługi (bar)
router.get("/orders", authRequired, employeeRequired, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    
    const params = [];
    if (status) {
      query += " WHERE o.status = ?";
      params.push(status);
    } else {
      // Pokaż wszystkie zamówienia które nie są jeszcze odebrane (włącznie z 'paid' i 'completed' które mogą być błędnie oznaczone)
      query += " WHERE o.status IN ('pending', 'ready', 'paid', 'completed')";
    }
    
    query += " ORDER BY o.created_at DESC";
    
    const [rows] = await pool.query(query, params);

    const result = rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
    }));

    res.json(result);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Błąd pobierania zamówień" });
  }
});

// Zmień status zamówienia (pending → ready → collected)
router.patch("/orders/:id/status", authRequired, employeeRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'ready', 'collected'].includes(status)) {
      return res.status(400).json({ message: "Nieprawidłowy status" });
    }

    const [result] = await pool.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Zamówienie nie znalezione" });
    }

    res.json({ message: "Status zaktualizowany", status });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Błąd aktualizacji statusu" });
  }
});

export default router;

