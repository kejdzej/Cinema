// server/src/routes/pdf.js
import { Router } from "express";
import PDFDocument from "pdfkit";
import { pool } from "../db.js";
import QRCode from "qrcode";

const router = Router();

router.get("/ticket/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [ticketRows] = await pool.query(
      `SELECT t.id, t.seats, t.price, t.created_at, s.datetime, s.hall_id, 
              m.title, m.duration, h.name as hall_name, h.capacity as hall_capacity
       FROM tickets t
       JOIN sessions s ON t.session_id = s.id
       JOIN movies m ON s.movie_id = m.id
       LEFT JOIN cinema_halls h ON s.hall_id = h.id
       WHERE t.id = ?`,
      [id]
    );

    if (!ticketRows.length) {
      return res.status(404).json({ error: "Nie znaleziono biletu" });
    }

    const ticket = ticketRows[0];

    // Generuj QR kod
    const qrData = `TICKET:${ticket.id}|${ticket.title}|${ticket.seats}|${ticket.datetime}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });

    // Konwertuj DataURL na Buffer
    const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=bilet_${id}.pdf`);

    // Stwórz PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Nagłówek (bez emoji - PDF nie obsługuje dobrze emoji)
    doc.fontSize(24).fillColor('#000000').text("BILET DO KINA", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666666').text(`Numer biletu: #${ticket.id}`, { align: "center" });
    doc.moveDown(1);

    // Główna sekcja
    doc.fontSize(18).fillColor('#000000').text(ticket.title, { align: "center" });
    doc.moveDown(0.5);
    
    doc.fontSize(12).fillColor('#333333');
    doc.text(`Data i godzina: ${new Date(ticket.datetime).toLocaleString("pl-PL")}`);
    doc.text(`Czas trwania: ${ticket.duration} minut`);
    
    if (ticket.hall_name) {
      doc.text(`Sala: ${ticket.hall_name}${ticket.hall_capacity ? ` (${ticket.hall_capacity} miejsc)` : ''}`);
    }
    
    doc.text(`Miejsca: ${ticket.seats}`);
    const price = typeof ticket.price === 'number' ? ticket.price : parseFloat(ticket.price) || 0;
    doc.text(`Cena: ${price.toFixed(2)} PLN`);
    doc.text(`Data zakupu: ${new Date(ticket.created_at).toLocaleString("pl-PL")}`);

    doc.moveDown(1);

    // QR kod - wyśrodkowany
    doc.image(qrCodeBuffer, {
      fit: [150, 150],
      align: 'center'
    });
    
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666666').text("Kod QR do weryfikacji", { align: "center" });

    doc.moveDown(1.5);

    // Stopka
    doc.fontSize(11).fillColor('#000000').text("Dziekujemy za zakup!", { align: "center" });
    doc.fontSize(10).fillColor('#666666').text("Zyczymy milego seansu!", { align: "center" });
    
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#999999').text("Ten bilet jest ważny tylko na wskazany seans.", { align: "center" });
    doc.text("Prosimy o przybycie 15 minut przed rozpoczęciem seansu.", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: "Błąd generowania PDF" });
  }
});

export default router;
