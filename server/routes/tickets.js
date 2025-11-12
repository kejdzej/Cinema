import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";


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

    // tworzymy bilet zgodnie ze schematem (bez kolumny 'status')
    const [result] = await pool.query(
      "INSERT INTO tickets (session_id, user_id, seats, price) VALUES (?, ?, ?, ?)",
      [session_id, req.user.id, seatStr, totalPrice]
    );

    res.json({
      ticket_id: result.insertId,
      amount: totalPrice,
      status: "confirmed",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
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

import QRCode from "qrcode";

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

export default router;
