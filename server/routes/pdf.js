// server/src/routes/pdf.js
import { Router } from "express";
import PDFDocument from "pdfkit";
import { pool } from "../db.js";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { calculateTotalPrice, calculateNumericPrice, detectHallType } from "../utils/pricingCalculator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get("/ticket/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [ticketRows] = await pool.query(
      `SELECT t.id, t.seats, t.price, t.status, t.created_at, s.datetime, s.hall_id, s.format, s.price as session_price,
              m.title, m.duration, h.name as hall_name, h.capacity as hall_capacity, h.description as hall_description
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
    const isRewardTicket = ticket.status === 'free' || Number(ticket.price) === 0;

    if (!isRewardTicket) {
      // Przelicz cenę używając wspólnego utility
      const seatArr = ticket.seats ? String(ticket.seats).split(',').map(s => s.trim()) : [];
      const hallInfo = {
        type: detectHallType(ticket.hall_name, ticket.hall_description),
        name: ticket.hall_name || '',
        capacity: parseInt(ticket.hall_capacity) || 40
      };
      const sessionPrice = calculateNumericPrice(ticket.session_price);

      ticket.price = calculateTotalPrice(seatArr, hallInfo, sessionPrice);
    } else {
      ticket.price = 0;
    }

    // Generuj QR kod
    const qrData = `TICKET:${ticket.id}|${ticket.title}|${ticket.seats}|${ticket.datetime}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });

    // Konwertuj DataURL na Buffer
    const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=bilet_${id}.pdf`);

    // Stwórz PDF z obsługą polskich znaków
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      // Użyj standardowego fontu który obsługuje polskie znaki
    });
    doc.pipe(res);
    
    // Ustaw font który obsługuje polskie znaki (Helvetica obsługuje podstawowe)
    // Dla lepszej obsługi można użyć fontu z polskimi znakami

    // Nagłówek (bez emoji - PDF nie obsługuje dobrze emoji)
    doc.fontSize(24).fillColor('#000000').text("BILET DO KINA", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666666').text(`Numer biletu: #${ticket.id}`, { align: "center" });
    doc.moveDown(1);

    // Główna sekcja
    doc.fontSize(18).fillColor('#000000').text(ticket.title, { align: "center" });
    doc.moveDown(0.3);
    
    // Format 3D jeśli dostępny
    if (ticket.format === '3D') {
      doc.fontSize(14).fillColor('#FFD700').text("3D", { align: "center" });
      doc.moveDown(0.3);
    }
    
    doc.moveDown(0.5);
    
    doc.fontSize(12).fillColor('#333333');
    doc.text(`Data i godzina: ${new Date(ticket.datetime).toLocaleString("pl-PL")}`);
    doc.text(`Czas trwania: ${ticket.duration} minut`);
    
    if (ticket.hall_name) {
      doc.text(`Sala: ${ticket.hall_name}${ticket.hall_capacity ? ` (${ticket.hall_capacity} miejsc)` : ''}`);
    }
    
    doc.text(`Miejsca: ${ticket.seats}`);
    const price = typeof ticket.price === 'number' ? ticket.price : parseFloat(ticket.price) || 0;
    doc.text(`Cena: ${price.toFixed(2)} PLN${isRewardTicket ? ' (Bilet lojalnościowy)' : ''}`);
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

    // Stopka - poprawione polskie znaki i lepsze formatowanie
    // Linia oddzielająca
    const lineY = doc.y;
    doc.moveTo(50, lineY)
       .lineTo(545, lineY)
       .strokeColor('#cccccc')
       .lineWidth(0.5)
       .stroke();
    doc.moveDown(1);
    
    // Użyj prostych tekstów bez polskich znaków diakrytycznych dla lepszej kompatybilności
    // lub użyj Unicode escape sequences
    // Teksty z poprawnymi polskimi znakami - PDFKit obsługuje UTF-8
    doc.fontSize(13).fillColor('#000000').text("Dziękujemy za zakup!", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor('#666666').text("Życzymy miłego seansu!", { align: "center" });
    
    doc.moveDown(1.2);
    doc.fontSize(9).fillColor('#999999').text("Ten bilet jest ważny tylko na wskazany seans.", { align: "center" });
    doc.moveDown(0.3);
    doc.text("Prosimy o przybycie 15 minut przed rozpoczęciem seansu.", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: "Błąd generowania PDF" });
  }
});

export default router;