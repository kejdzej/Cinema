import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Получение очков
router.get("/points", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT points FROM users WHERE id = ?",
      [req.user.id]
    );
    return res.json({ points: rows[0]?.points || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Списание очков
router.post("/spend", authRequired, async (req, res) => {
  const { amount } = req.body;
  try {
    const [[user]] = await pool.query(
      "SELECT points FROM users WHERE id = ?",
      [req.user.id]
    );

    if ((user?.points || 0) < amount) {
      return res.status(400).json({ message: "Not enough points" });
    }

    await pool.query(
      "UPDATE users SET points = points - ? WHERE id = ?",
      [amount, req.user.id]
    );

    await pool.query(
  "INSERT INTO loyalty_history (user_id, change_amount, description) VALUES (?, ?, ?)",
  [req.user.id, -amount, "Redeem reward"]
);


    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// **Начисление очков**
router.post("/add", authRequired, async (req, res) => {
  const { amount, description } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    // Добавляем очки пользователю
    await pool.query(
      "UPDATE users SET points = points + ? WHERE id = ?",
      [amount, req.user.id]
    );

    // Записываем историю
    await pool.query(
      "INSERT INTO loyalty_history (user_id, points, type, description) VALUES (?, ?, 'add', ?)",
      [req.user.id, amount, description || 'Bonus points']
    );

    return res.json({ success: true, added: amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
