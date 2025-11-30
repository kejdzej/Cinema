// server/src/routes/pdf.js
import { Router } from "express";
import PDFDocument from "pdfkit";
import { pool } from "../db.js";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get("/ticket/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [ticketRows] = await pool.query(
      `SELECT t.id, t.seats, t.price, t.created_at, s.datetime, s.hall_id, s.format, s.price as session_price,
              m.title, m.duration, h.name as hall_name, h.capacity as hall_capacity, h.description as hall_type
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
    
    // Przelicz cenę (tak jak w /tickets/:id) - zawsze aktualna cena
    const seatArr = ticket.seats ? String(ticket.seats).split(',').map(s => s.trim()) : [];
    const hallName = ticket.hall_name || '';
    const hallType = ticket.hall_type || 'standard';
    const hallCapacity = parseInt(ticket.hall_capacity) || 40;
    const sessionPrice = typeof ticket.session_price === 'string' 
      ? parseFloat(ticket.session_price.replace(/[^\d.-]/g, '')) 
      : parseFloat(ticket.session_price) || 0;
    
    // Funkcja pomocnicza do określania czy miejsce to kanapa
    const isSeatCouch = (seat) => {
      const rowLetter = seat.trim()[0];
      if (hallType === 'vip' && hallName.includes('Sala 4')) {
        return ['F', 'G'].includes(rowLetter);
      } else if (hallType === 'mixed' && hallName.includes('Sala 3')) {
        return ['I', 'J'].includes(rowLetter);
      } else {
        const rowNumber = rowLetter.charCodeAt(0);
        if (hallCapacity === 72) {
          return rowNumber >= 72; // H = 72, I = 73
        } else if (hallCapacity === 50) {
          // Sala 2: tylko D i E są kanapami
          return rowNumber === 68 || rowNumber === 69; // D = 68, E = 69
        } else {
          return rowNumber >= 70; // F = 70, G = 71
        }
      }
    };
    
    // Przelicz cenę
    let recalculatedPrice = 0;
    for (const seat of seatArr) {
      if (hallType === 'vip' && hallName.includes('Sala 4')) {
        recalculatedPrice += (isSeatCouch(seat) ? 70 : 35);
      } else {
        const isCouch = isSeatCouch(seat);
        recalculatedPrice += (isCouch ? sessionPrice * 2 : sessionPrice);
      }
    }
    recalculatedPrice = Math.round(recalculatedPrice * 100) / 100;
    
    // Użyj przeliczonej ceny
    ticket.price = recalculatedPrice;

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
