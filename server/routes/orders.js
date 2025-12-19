import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import QRCode from "qrcode";

const router = Router();

function normalizeItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return raw; // mysql JSON may already be parsed (array/object)
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

// 📌 Создание заказа
router.post("/", authRequired, async (req, res) => {
  try {
    const { items, total } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      "INSERT INTO orders (user_id, items, total, status, created_at) VALUES (?, ?, ?, ?, NOW())",
      [userId, JSON.stringify(items), total, "pending"]
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

    const result = rows.map(r => {
      const parsedItems = normalizeItems(r.items);
      return {
        id: r.id,
        items: Array.isArray(parsedItems) ? parsedItems : [],
        total: r.total,
        status: r.status,
        created_at: r.created_at
      }
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// 📌 Один заказ по ID
router.get("/:id", authRequired, async (req, res) => {
  try {
    // QR is dynamic (can change format), so don't allow caching
    res.set("cache-control", "no-store");
    res.set("pragma", "no-cache");
    res.set("expires", "0");

    const [rows] = await pool.query(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Zamówienie nie znalezione" });
    }

    const order = rows[0];
    
    const parsedItems = normalizeItems(order.items);

    // Generujemy QR w prostym formacie (nie JSON),
    // żeby po skanowaniu nie wyświetlał się "surowy" JSON.
    // Szczegóły zamówienia pracownik i tak pobiera po ID z bazy.
    const qr_payload = `ORDER:${order.id}`;
    const qr = await QRCode.toDataURL(qr_payload);

    res.json({
      id: order.id,
      items: Array.isArray(parsedItems) ? parsedItems : [],
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      qr_payload,
      qr
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd pobierania zamówienia" });
  }
});

// Wszystkie zamówienia dla pracownika (bar)
router.get("/bar/pending", authRequired, async (req, res) => {
  try {
    // Sprawdź czy użytkownik to pracownik lub admin
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ message: "Brak uprawnień" });
    }

    const [rows] = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status IN ('pending', 'ready')
       ORDER BY o.created_at DESC`
    );

    const result = rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Zmień status zamówienia (dla pracownika/admina lub użytkownika)
router.patch("/:id/status", authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Sprawdź czy użytkownik to pracownik/admin (może zmieniać statusy barowe)
    if (req.user.role === 'admin' || req.user.role === 'employee') {
      if (!['pending', 'ready', 'collected', 'paid', 'failed', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Nieprawidłowy status" });
      }
      
      const [result] = await pool.query(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Zamówienie nie znalezione" });
      }

      return res.json({ message: "Status zaktualizowany", status });
    } else {
      // Zwykły użytkownik może zmieniać tylko swoje zamówienia
      const allowed = new Set(['pending', 'paid', 'failed', 'completed']);
      if (!allowed.has(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const [result] = await pool.query(
        'UPDATE orders SET status = ? WHERE id = ? AND user_id = ? LIMIT 1',
        [status, id, req.user.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      return res.json({ ok: true });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Błąd zmiany statusu' });
  }
});

export default router;
