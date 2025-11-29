import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Prosty chatbot bez OpenAI - używa reguł i bazy danych
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Brak wiadomości" });
    }

    const lowerMsg = message.toLowerCase().trim();
    let reply = "";

    // Repertuar / filmy / bilety
    if (lowerMsg.includes("film") || lowerMsg.includes("repertuar") || lowerMsg.includes("co gra") || lowerMsg.includes("seanse") || lowerMsg.includes("bilety") || lowerMsg.includes("biletów")) {
      try {
        const [rows] = await pool.query(`
          SELECT m.title, m.description, m.duration, s.datetime, s.price, h.name as hall_name
          FROM sessions s
          JOIN movies m ON s.movie_id = m.id
          LEFT JOIN cinema_halls h ON s.hall_id = h.id
          WHERE s.datetime >= NOW()
          ORDER BY s.datetime
          LIMIT 5
        `);

        if (rows.length === 0) {
          reply = "Przepraszam, aktualnie nie mamy dostepnych seansow. Sprawdz pozniej!";
        } else {
          reply = "Oto nasze aktualne filmy:\n\n";
          rows.forEach((r, idx) => {
            reply += `${idx + 1}. ${r.title}\n`;
            reply += `   Data: ${new Date(r.datetime).toLocaleString("pl-PL")}\n`;
            if (r.hall_name) reply += `   Sala: ${r.hall_name}\n`;
            reply += `   ${r.duration} min | ${parseFloat(r.price).toFixed(2)} zl\n`;
            if (r.description) reply += `   ${r.description.substring(0, 100)}...\n`;
            reply += "\n";
          });
          reply += "Mozesz zarezerwowac bilet na naszej stronie!";
        }
      } catch (err) {
        console.error("Chatbot filmy error:", err);
        reply = "Przepraszam, wystapil blad przy pobieraniu repertuaru. Sprawdz pozniej!";
      }
    }
    // Ceny
    else if (lowerMsg.includes("cena") || lowerMsg.includes("ile kosztuje") || lowerMsg.includes("koszt") || lowerMsg.includes("ceny") || lowerMsg.includes("biletów") || lowerMsg.includes("bilety")) {
      try {
        const [rows] = await pool.query(`
          SELECT MIN(CAST(price AS DECIMAL(10,2))) as min_price, 
                 MAX(CAST(price AS DECIMAL(10,2))) as max_price, 
                 AVG(CAST(price AS DECIMAL(10,2))) as avg_price
          FROM sessions
          WHERE datetime >= NOW()
        `);
        
        if (rows[0]?.min_price !== null && rows[0]?.min_price !== undefined) {
          reply = `Ceny biletow:\n`;
          reply += `   • Najtanszy: ${parseFloat(rows[0].min_price).toFixed(2)} zl\n`;
          reply += `   • Najdrozszy: ${parseFloat(rows[0].max_price).toFixed(2)} zl\n`;
          reply += `   • Srednia: ${parseFloat(rows[0].avg_price).toFixed(2)} zl\n\n`;
          reply += `Ceny moga sie roznic w zaleznosci od seansu i sali.`;
        } else {
          reply = "Aktualnie nie mamy dostepnych seansow. Sprawdz pozniej!";
        }
      } catch (err) {
        console.error("Chatbot ceny error:", err);
        reply = "Przepraszam, wystapil blad przy pobieraniu cen. Sprawdz pozniej!";
      }
    }
    // Godziny otwarcia
    else if (lowerMsg.includes("godziny") || lowerMsg.includes("otwarte") || lowerMsg.includes("kiedy")) {
      reply = "🕐 Kino jest otwarte:\n";
      reply += "   • Poniedziałek - Piątek: 10:00 - 22:00\n";
      reply += "   • Sobota - Niedziela: 9:00 - 23:00\n\n";
      reply += "Seanse odbywają się przez cały dzień. Sprawdź repertuar na stronie głównej!";
    }
    // Lokalizacja / adres
    else if (lowerMsg.includes("gdzie") || lowerMsg.includes("adres") || lowerMsg.includes("lokalizacja")) {
      reply = "📍 Nasze kino znajduje się w centrum miasta.\n";
      reply += "   Adres: ul. Kinowa 123, 00-000 Warszawa\n";
      reply += "   Dojazd: Metro linia M2, przystanek 'Kino'\n\n";
      reply += "Zapraszamy!";
    }
    // Program lojalnościowy
    else if (lowerMsg.includes("punkty") || lowerMsg.includes("lojalności") || lowerMsg.includes("nagrody")) {
      reply = "🎁 Program lojalnościowy:\n";
      reply += "   • Za każdy zakup biletu otrzymujesz 100 punktów\n";
      reply += "   • Punkty możesz wymieniać na nagrody\n";
      reply += "   • Sprawdź szczegóły w zakładce 'Program lojalnościowy'\n\n";
      reply += "Zaloguj się aby zobaczyć swoje punkty!";
    }
    // Pomoc
    else if (lowerMsg.includes("pomoc") || lowerMsg.includes("help") || lowerMsg.includes("co mogę")) {
      reply = "🤖 Jestem asystentem kina! Mogę pomóc z:\n";
      reply += "   • Repertuarem i seansami\n";
      reply += "   • Cenami biletów\n";
      reply += "   • Godzinami otwarcia\n";
      reply += "   • Programem lojalnościowym\n";
      reply += "   • Lokalizacją kina\n\n";
      reply += "Zapytaj mnie o coś!";
    }
    // Domyślna odpowiedź
    else {
      reply = "Przepraszam, nie rozumiem. Spróbuj zapytać o:\n";
      reply += "• Repertuar / filmy\n";
      reply += "• Ceny biletów\n";
      reply += "• Godziny otwarcia\n";
      reply += "• Program lojalnościowy\n";
      reply += "• Lokalizację kina";
    }

    res.json({ reply });
  } catch (err) {
    console.error("❌ Assistant error:", err);
    res.status(500).json({ error: "Błąd asystenta" });
  }
});

export default router;
