import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import QRCode from "qrcode";
import { BASE_POINTS_FOR_PURCHASE, FREE_TICKET_COST } from "./loyalty.js";

const router = Router();

const MIN_POINTS_PER_PURCHASE = BASE_POINTS_FOR_PURCHASE || 50;

const calculateNumericPrice = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const calculatePointsForAmount = (amount) => {
  const numeric = calculateNumericPrice(amount);
  if (numeric <= 0) return MIN_POINTS_PER_PURCHASE;
  return Math.max(MIN_POINTS_PER_PURCHASE, Math.round(numeric));
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
      "SELECT s.price, s.format, s.hall_id, h.name as hall_name, h.description as hall_type, h.capacity as hall_capacity FROM sessions s LEFT JOIN cinema_halls h ON s.hall_id = h.id WHERE s.id = ?",
      [session_id]
    );
    if (!session) return res.status(404).json({ message: "Session not found" });

    const hallName = session.hall_name || '';
    const hallType = session.hall_type || 'standard';
    const hallCapacity = parseInt(session.hall_capacity) || 40;
    
    // Upewnij się, że price jest liczbą
    const sessionPrice = typeof session.price === 'string' 
      ? parseFloat(session.price.replace(/[^\d.-]/g, '')) 
      : parseFloat(session.price) || 0;
    
    // Funkcja pomocnicza do określania czy miejsce to kanapa
    const isSeatCouch = (seat) => {
      const rowLetter = seat.trim()[0];
      if (hallType === 'vip' && hallName.includes('Sala 4')) {
        // Sala 4 VIP: rzędy F-G to kanapy VIP
        return ['F', 'G'].includes(rowLetter);
      } else if (hallType === 'mixed' && hallName.includes('Sala 3')) {
        // Sala 3: rzędy I-J to kanapy (po 8 rzędach foteli A-H)
        return ['I', 'J'].includes(rowLetter);
      } else {
        // Standardowy układ: ostatnie 2 rzędy to kanapy
        const rowNumber = rowLetter.charCodeAt(0);
        if (hallCapacity === 72) {
          // Sala 1: 9 rzędów (A-I), ostatnie 2 to H i I
          return rowNumber >= 72; // H = 72, I = 73
        } else if (hallCapacity === 50) {
          // Sala 2: 5 rzędów (A-E), ostatnie 2 (D-E) to kanapy
          // Tylko D i E są kanapami, nie G i H!
          return rowNumber === 68 || rowNumber === 69; // D = 68, E = 69
        } else {
          // Standardowy: 7 rzędów (A-G), ostatnie 2 to F i G
          return rowNumber >= 70; // F = 70, G = 71
        }
      }
    };
    
    // Oblicz cenę
    // Dla seansów 3D cena bazowa jest już wyższa (28 zł zamiast 22 zł)
    // Więc nie mnożymy dodatkowo, tylko używamy ceny z sesji
    const basePrice = sessionPrice;
    let totalPrice = 0;
    
    // Debug: loguj informacje o miejscach
    console.log(`[PRICE CALC] Sala: ${hallName}, Type: ${hallType}, Capacity: ${hallCapacity}, BasePrice: ${basePrice}, Seats: ${seatArr.join(', ')}`);
    
    for (const seat of seatArr) {
      if (hallType === 'vip' && hallName.includes('Sala 4')) {
        // Sala 4 VIP: fotele VIP = 35 zł, kanapy VIP = 70 zł
        const isCouch = isSeatCouch(seat);
        const seatPrice = isCouch ? 70 : 35;
        totalPrice += seatPrice;
        console.log(`[PRICE CALC] ${seat}: ${isCouch ? 'kanapa VIP' : 'fotel VIP'} = ${seatPrice} zł`);
      } else {
        // Standardowe ceny: kanapy = 2x cena, zwykłe = 1x cena
        // Cena sesji już uwzględnia format 3D (jeśli jest)
        const isCouch = isSeatCouch(seat);
        const seatPrice = isCouch ? basePrice * 2 : basePrice;
        totalPrice += seatPrice;
        console.log(`[PRICE CALC] ${seat}: ${isCouch ? 'kanapa' : 'zwykłe'} = ${seatPrice} zł (base: ${basePrice})`);
      }
    }
    
    // Upewnij się, że totalPrice jest liczbą (zaokrąglij do 2 miejsc po przecinku)
    totalPrice = Math.round(totalPrice * 100) / 100;
    console.log(`[PRICE CALC] TOTAL: ${totalPrice} zł`);

    // tworzymy bilet
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
             m.title, h.name as hall_name, h.description as hall_type, h.capacity as hall_capacity
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
        const hallName = ticket.hall_name || '';
        const hallType = ticket.hall_type || 'standard';
        const hallCapacity = parseInt(ticket.hall_capacity) || 40;
        const sessionPrice = typeof ticket.session_price === 'string' 
          ? parseFloat(ticket.session_price.replace(/[^\d.-]/g, '')) 
          : parseFloat(ticket.session_price) || 0;
        
        // Funkcja pomocnicza do określania czy miejsce to kanapa (ta sama co w purchase)
        const isSeatCouch = (seat) => {
          const rowLetter = seat.trim()[0];
          if (hallType === 'vip' && hallName.includes('Sala 4')) {
            return ['F', 'G'].includes(rowLetter);
          } else if (hallType === 'mixed' && hallName.includes('Sala 3')) {
            return ['I', 'J'].includes(rowLetter);
          } else {
            const rowNumber = rowLetter.charCodeAt(0);
            if (hallCapacity === 72) {
              return rowNumber >= 72;
            } else if (hallCapacity === 50) {
              // Poprawka: tylko D i E są kanapami
              return rowNumber === 68 || rowNumber === 69;
            } else {
              return rowNumber >= 70;
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
        
        // Użyj przeliczonej ceny (zawsze aktualna)
        ticket.price = recalculatedPrice;
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
             m.title, h.name as hall_name, h.description as hall_type, h.capacity as hall_capacity
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
      const hallName = ticket.hall_name || '';
      const hallType = ticket.hall_type || 'standard';
      const hallCapacity = parseInt(ticket.hall_capacity) || 40;
      const sessionPrice = typeof ticket.session_price === 'string' 
        ? parseFloat(ticket.session_price.replace(/[^\d.-]/g, '')) 
        : parseFloat(ticket.session_price) || 0;
      
      // Funkcja pomocnicza do określania czy miejsce to kanapa (ta sama co w purchase)
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