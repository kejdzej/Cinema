import { Router } from "express";
import { OpenAI } from "openai";
import { pool } from "../db.js";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Brak wiadomości" });
    }

    // probowanie zrozumiec kontekst
    let prompt = `Jesteś asystentem kina. Udzielaj krótkich i przyjaznych odpowiedzi po polsku.
Użytkownik napisał: "${message}".`;

    // przyklad integracji z baza(rekomendacje filmow)
    if (message.toLowerCase().includes("film")) {
  const [rows] = await pool.query(`
    SELECT m.title, m.description, m.duration, s.datetime, s.price
    FROM sessions s
    JOIN movies m ON s.movie_id = m.id
    ORDER BY s.datetime
    LIMIT 5
  `);

  const filmList = rows
    .map(r =>
      `${r.title} – ${new Date(r.datetime).toLocaleString("pl-PL")} (${r.duration} min, ${r.price} PLN)\nOpis: ${r.description}`
    )
    .join("\n\n");

  prompt += ` Oto lista filmów w repertuarze:\n${filmList}\nNa tej podstawie zaproponuj coś widzowi.`;
}



    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Jesteś asystentem kina, pomagaj użytkownikom." },
        { role: "user", content: prompt },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("❌ Assistant error:", err);
    res.status(500).json({ error: "Błąd połączenia z asystentem" });
  }
});

export default router;
