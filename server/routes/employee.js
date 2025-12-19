import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function extractOrderIdFromQr(qrDataRaw) {
  const qrData = String(qrDataRaw || "").trim();
  if (!qrData) return null;

  // Primary format in this project: JSON string with { id, items, total, date }
  if (qrData.startsWith("{") && qrData.endsWith("}")) {
    const parsed = safeJsonParse(qrData);
    const id = parsed?.id;
    const numericId = Number.isFinite(Number(id)) ? parseInt(id) : null;
    return numericId && numericId > 0 ? numericId : null;
  }

  // Fallbacks for potential alternate formats
  const m1 = qrData.match(/ORDER:(\d+)/i);
  if (m1?.[1]) return parseInt(m1[1]);

  const m2 = qrData.match(/"id"\s*:\s*(\d+)/i);
  if (m2?.[1]) return parseInt(m2[1]);

  return null;
}

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

// Weryfikacja zamówienia (produkty) przez QR kod
router.post("/orders/verify", authRequired, employeeRequired, async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: "Brak danych QR" });
    }

    const orderId = extractOrderIdFromQr(qrData);
    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ message: "Nieprawidłowy format QR zamówienia" });
    }

    const [rows] = await pool.query(
      `
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
        LIMIT 1
      `,
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Zamówienie nie znalezione" });
    }

    const order = rows[0];
    const items = typeof order.items === "string" ? safeJsonParse(order.items) : order.items;
    const normalized = {
      id: order.id,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      user_name: order.user_name,
      user_email: order.user_email,
      items: Array.isArray(items) ? items : [],
    };

    return res.json({
      message: "Zamówienie odczytane",
      order: normalized,
      verified: true,
    });
  } catch (error) {
    console.error("Verify order error:", error);
    res.status(500).json({ message: "Błąd weryfikacji zamówienia" });
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

