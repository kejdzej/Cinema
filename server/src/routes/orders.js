import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import QRCode from "qrcode";

const router = Router();

// 📌 Создание заказа
router.post("/", authRequired, async (req, res) => {
  try {
    const { items, total } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      "INSERT INTO orders (user_id, items, total, status, created_at) VALUES (?, ?, ?, ?, NOW())",
      [userId, JSON.stringify(items), total, "paid"]
    );

    res.json({ message: "Zamówienie zapisane!", order_id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera przy zamówieniu" });
  }
});

// 📌 Все заказы юзера
router.get("/", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    const result = rows.map(r => ({
      id: r.id,
      items: JSON.parse(r.items),
      total: r.total,
      status: r.status,
      created_at: r.created_at
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// 📌 Один заказ по ID
router.get("/:id", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Zamówienie nie znalezione" });
    }

    const order = rows[0];
    const data = {
      id: order.id,
      items: JSON.parse(order.items),
      total: order.total,
      date: order.created_at
    };

    // генерируем QR
    const qr = await QRCode.toDataURL(JSON.stringify(data));

    res.json({
      id: order.id,
      items: JSON.parse(order.items),
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      qr
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd pobierania zamówienia" });
  }
});

export default router;
