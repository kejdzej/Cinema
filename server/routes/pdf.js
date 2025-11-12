// server/src/routes/pdf.js
import { Router } from "express";
import PDFDocument from "pdfkit";
import { pool } from "../db.js";

const router = Router();

router.get("/ticket/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [ticketRows] = await pool.query(
      `SELECT t.id, s.datetime, s.price, m.title, m.duration 
       FROM tickets t
       JOIN sessions s ON t.session_id = s.id
       JOIN movies m ON s.movie_id = m.id
       WHERE t.id = ?`,
      [id]
    );

    if (!ticketRows.length) {
      return res.status(404).json({ error: "Nie znaleziono biletu" });
    }

    const ticket = ticketRows[0];

    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=ticket_${id}.pdf`);

    // stworz pdf
    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(22).text("🎬 Bilet do Kina", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Film: ${ticket.title}`);
    doc.text(`Czas trwania: ${ticket.duration} minut`);
    doc.text(`Data i godzina: ${new Date(ticket.datetime).toLocaleString("pl-PL")}`);
    doc.text(`Cena: ${ticket.price} PLN`);
    doc.text(`Numer biletu: ${ticket.id}`);

    doc.moveDown();
    doc.fontSize(12).text("Dziękujemy za zakup! Życzymy miłego seansu 🍿", {
      align: "center",
    });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: "Błąd generowania PDF" });
  }
});

export default router;
