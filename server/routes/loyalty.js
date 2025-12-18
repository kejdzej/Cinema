import crypto from "crypto";
import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const REWARD_CATALOG = [
  {
    id: "free-ticket",
    name: "Bilet gratis",
    description: "500 pkt • Dowolny seans z repertuaru bez płatności.",
    cost: 500,
    type: "ticket",
    requiresSession: true,
    fulfillment: "ticket"
  },
  {
    id: "popcorn-cola",
    name: "Popcorn + Cola",
    description: "300 pkt • Zestaw średni popcorn + napój 0.5l.",
    cost: 300,
    type: "bar",
    requiresSession: false,
    fulfillment: "order",
    items: [
      { sku: "reward-popcorn-cola", name: "Zestaw: Popcorn + Cola", qty: 1, price: 0, reward: true }
    ]
  },
  {
    id: "movie-night",
    name: "Zestaw x2",
    description: "650 pkt • Duży popcorn + dwa napoje.",
    cost: 650,
    type: "bar",
    requiresSession: false,
    fulfillment: "order",
    items: [
      { sku: "reward-popcorn-xl", name: "Popcorn XL", qty: 1, price: 0, reward: true },
      { sku: "reward-drink", name: "Napój 0.5l", qty: 2, price: 0, reward: true }
    ]
  },
  {
    id: "drink",
    name: "Napój 0.5l",
    description: "100 pkt • Dowolny napój z baru.",
    cost: 100,
    type: "bar",
    requiresSession: false,
    fulfillment: "order",
    items: [
      { sku: "reward-single-drink", name: "Napój 0.5l", qty: 1, price: 0, reward: true }
    ]
  }
];

const FREE_TICKET_REWARD = REWARD_CATALOG.find((r) => r.id === "free-ticket");
const FREE_TICKET_COST = FREE_TICKET_REWARD?.cost || 500;

const BASE_POINTS_FOR_PURCHASE = 50;

const historyDescriptions = {
  purchase: "Zakup biletu",
  cancel: "Anulowanie biletu",
  rewardRedeem: "Wymiana punktów",
  rewardTicket: "Bilet gratis z punktów"
};

function normalizeSeats(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((seat) => seat.trim()).filter(Boolean);
  return String(input)
    .split(",")
    .map((seat) => seat.trim())
    .filter(Boolean);
}

async function getUserBalance(userId) {
  const [[row]] = await pool.query("SELECT points FROM users WHERE id = ?", [userId]);
  return row?.points || 0;
}

async function logHistory(executor, userId, delta, description, resultingPoints) {
  const target = executor || pool;
  await target.query(
    "INSERT INTO loyalty_history (user_id, change_amount, description, points) VALUES (?, ?, ?, ?)",
    [userId, delta, description, resultingPoints ?? null]
  );
}

async function ensureLoyaltyCode(userId) {
  const [[row]] = await pool.query("SELECT loyalty_code FROM users WHERE id = ?", [userId]);
  if (row?.loyalty_code) return row.loyalty_code;

  let code = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    code = `LOY-${userId}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const [exists] = await pool.query("SELECT id FROM users WHERE loyalty_code = ? LIMIT 1", [code]);
    if (!exists.length) break;
    code = null;
  }
  if (!code) {
    code = `LOY-${userId}-${Date.now()}`;
  }
  await pool.query("UPDATE users SET loyalty_code = ? WHERE id = ? LIMIT 1", [code, userId]);
  return code;
}

router.get("/points", authRequired, async (req, res) => {
  try {
    const points = await getUserBalance(req.user.id);
    return res.json({ points });
  } catch (err) {
    console.error("[LOYALTY] points error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/balance", authRequired, async (req, res) => {
  try {
    const points = await getUserBalance(req.user.id);
    return res.json({ points });
  } catch (err) {
    console.error("[LOYALTY] balance error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/history", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT id, change_amount, description, created_at, points
        FROM loyalty_history
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("[LOYALTY] history error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/rewards", authRequired, async (_req, res) => {
  res.json(REWARD_CATALOG);
});

router.get("/code", authRequired, async (req, res) => {
  try {
    const code = await ensureLoyaltyCode(req.user.id);
    res.json({ loyalty_code: code });
  } catch (err) {
    console.error("[LOYALTY] code error:", err);
    res.status(500).json({ message: "Nie udało się wygenerować kodu" });
  }
});

router.post("/redeem", authRequired, async (req, res) => {
  const { reward } = req.body;
  try {
    const rewardDef = REWARD_CATALOG.find((item) => item.id === reward);
    if (!rewardDef) {
      return res.status(404).json({ message: "Nieznana nagroda" });
    }

    if (rewardDef.fulfillment === "ticket") {
      return res.status(400).json({
        message: "Ta nagroda wymaga wyboru seansu i miejsc.",
        requiresSession: true
      });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [[user]] = await connection.query(
        "SELECT points FROM users WHERE id = ? FOR UPDATE",
        [req.user.id]
      );
      const currentPoints = user?.points || 0;

      if (currentPoints < rewardDef.cost) {
        await connection.rollback();
        return res.status(400).json({ message: "Masz za mało punktów" });
      }

      const updatedPoints = currentPoints - rewardDef.cost;
      await connection.query("UPDATE users SET points = ? WHERE id = ?", [
        updatedPoints,
        req.user.id
      ]);

      await logHistory(
        connection,
        req.user.id,
        -rewardDef.cost,
        rewardDef.name || historyDescriptions.rewardRedeem,
        updatedPoints
      );

      const itemsPayload = rewardDef.items || [
        { sku: rewardDef.id, name: rewardDef.name, qty: 1, price: 0, reward: true }
      ];

      const [orderResult] = await connection.query(
        "INSERT INTO orders (user_id, items, total, status, created_at) VALUES (?, ?, 0, 'free', NOW())",
        [req.user.id, JSON.stringify(itemsPayload)]
      );

      await connection.commit();
      res.json({
        success: true,
        message: "Nagroda dodana do Twoich zamówień.",
        order_id: orderResult.insertId,
        newBalance: updatedPoints
      });
    } catch (err) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackErr) {
          console.error("[LOYALTY] redeem rollback error:", rollbackErr);
        }
      }
      console.error("[LOYALTY] redeem error:", err);
      res.status(500).json({ message: "Nie udało się wymienić punktów" });
    } finally {
      if (connection) connection.release();
    }
  } catch (err) {
    console.error("[LOYALTY] redeem outer error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/redeem/free-ticket", authRequired, async (req, res) => {
  const { session_id, seats } = req.body;
  const seatList = normalizeSeats(seats);

  if (!session_id || !seatList.length) {
    return res.status(400).json({ message: "Wybierz seans i przynajmniej jedno miejsce." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[user]] = await connection.query(
      "SELECT points FROM users WHERE id = ? FOR UPDATE",
      [req.user.id]
    );
    const currentPoints = user?.points || 0;

    if (currentPoints < FREE_TICKET_COST) {
      await connection.rollback();
      return res.status(400).json({ message: "Masz za mało punktów na darmowy bilet." });
    }

    const [[session]] = await connection.query(
      `SELECT s.id, s.datetime, s.hall_id, m.title 
       FROM sessions s 
       JOIN movies m ON m.id = s.movie_id
       WHERE s.id = ? FOR UPDATE`,
      [session_id]
    );
    if (!session) {
      await connection.rollback();
      return res.status(404).json({ message: "Seans nie istnieje." });
    }

    const [takenRows] = await connection.query(
      "SELECT seats FROM tickets WHERE session_id = ? FOR UPDATE",
      [session_id]
    );
    const taken = new Set();
    takenRows.forEach((row) => {
      normalizeSeats(row.seats).forEach((seat) => taken.add(seat));
    });

    const conflict = seatList.find((seat) => taken.has(seat));
    if (conflict) {
      await connection.rollback();
      return res.status(409).json({ message: `Miejsce ${conflict} jest już zajęte.` });
    }

    const seatString = seatList.join(",");
    const [ticketResult] = await connection.query(
      "INSERT INTO tickets (session_id, user_id, seats, price, status) VALUES (?, ?, ?, 0, 'free')",
      [session_id, req.user.id, seatString]
    );

    const orderItems = [
      {
        sku: "reward-free-ticket",
        type: "Free Ticket",
        movie: session.title,
        seats: seatList,
        qty: seatList.length,
        price: 0,
        reward: true
      }
    ];
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, items, total, status, created_at) VALUES (?, ?, 0, 'free', NOW())",
      [req.user.id, JSON.stringify(orderItems)]
    );

    const updatedPoints = currentPoints - FREE_TICKET_COST;
    await connection.query("UPDATE users SET points = ? WHERE id = ?", [
      updatedPoints,
      req.user.id
    ]);

    await logHistory(
      connection,
      req.user.id,
      -FREE_TICKET_COST,
      historyDescriptions.rewardTicket,
      updatedPoints
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Bilet gratis został zapisany. Znajdziesz go w zakładce Moje bilety.",
      ticket_id: ticketResult.insertId,
      order_id: orderResult.insertId,
      newBalance: updatedPoints
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("[LOYALTY] rollback error:", rollbackErr);
      }
    }
    console.error("[LOYALTY] free ticket error:", err);
    res.status(500).json({ message: "Nie udało się wykorzystać darmowego biletu" });
  } finally {
    if (connection) connection.release();
  }
});

router.post("/spend", authRequired, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Nieprawidłowa kwota" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[user]] = await connection.query(
      "SELECT points FROM users WHERE id = ? FOR UPDATE",
      [req.user.id]
    );
    const current = user?.points || 0;
    if (current < amount) {
      await connection.rollback();
      return res.status(400).json({ message: "Masz za mało punktów" });
    }

    const updatedPoints = current - amount;
    await connection.query("UPDATE users SET points = ? WHERE id = ?", [updatedPoints, req.user.id]);
    await logHistory(connection, req.user.id, -amount, historyDescriptions.rewardRedeem, updatedPoints);
    await connection.commit();

    res.json({ success: true, newBalance: updatedPoints });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("[LOYALTY] spend rollback error:", rollbackErr);
      }
    }
    console.error("[LOYALTY] spend error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
});

router.post("/add", authRequired, async (req, res) => {
  const { amount, description } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Nieprawidłowa kwota" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[user]] = await connection.query(
      "SELECT points FROM users WHERE id = ? FOR UPDATE",
      [req.user.id]
    );
    const current = user?.points || 0;
    const updatedPoints = current + amount;
    await connection.query("UPDATE users SET points = ? WHERE id = ?", [updatedPoints, req.user.id]);
    await logHistory(connection, req.user.id, amount, description || "Bonus points", updatedPoints);
    await connection.commit();
    res.json({ success: true, added: amount, newBalance: updatedPoints });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("[LOYALTY] add rollback error:", rollbackErr);
      }
    }
    console.error("[LOYALTY] add error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
});

export { BASE_POINTS_FOR_PURCHASE, FREE_TICKET_COST };
export default router;