import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { adminRequired } from "../middleware/admin.js";

const router = Router();

// Raport sprzedaży
router.get("/sales", authRequired, adminRequired, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        DATE(t.created_at) as date,
        COUNT(t.id) as tickets_sold,
        COALESCE(SUM(CAST(t.price AS DECIMAL(10,2))), 0) as total_revenue,
        COUNT(DISTINCT t.user_id) as unique_customers
      FROM tickets t
    `;
    
    const params = [];
    if (startDate && endDate) {
      query += " WHERE DATE(t.created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    query += " GROUP BY DATE(t.created_at) ORDER BY date DESC LIMIT 30";
    
    const [rows] = await pool.query(query, params);
    
    // Statystyki ogólne
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_tickets,
        COALESCE(SUM(CAST(price AS DECIMAL(10,2))), 0) as total_revenue,
        COALESCE(AVG(CAST(price AS DECIMAL(10,2))), 0) as avg_ticket_price,
        COUNT(DISTINCT user_id) as total_customers
      FROM tickets
    `);
    
    res.json({
      daily: rows.map(r => ({
        ...r,
        total_revenue: parseFloat(r.total_revenue) || 0
      })),
      summary: {
        total_tickets: parseInt(stats[0].total_tickets) || 0,
        total_revenue: parseFloat(stats[0].total_revenue) || 0,
        avg_ticket_price: parseFloat(stats[0].avg_ticket_price) || 0,
        total_customers: parseInt(stats[0].total_customers) || 0
      }
    });
  } catch (error) {
    console.error("Sales report error:", error);
    res.status(500).json({ message: "Błąd generowania raportu" });
  }
});

// Raport obłożenia sal
router.get("/occupancy", authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        h.id as hall_id,
        h.name as hall_name,
        h.capacity,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(t.id) as tickets_sold,
        COALESCE(SUM(CAST(t.price AS DECIMAL(10,2))), 0) as revenue,
        CASE 
          WHEN h.capacity * COUNT(DISTINCT s.id) > 0 
          THEN ROUND((COUNT(t.id) / (h.capacity * COUNT(DISTINCT s.id))) * 100, 2)
          ELSE 0
        END as occupancy_rate
      FROM cinema_halls h
      LEFT JOIN sessions s ON s.hall_id = h.id
      LEFT JOIN tickets t ON t.session_id = s.id
      GROUP BY h.id, h.name, h.capacity
      ORDER BY occupancy_rate DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error("Occupancy report error:", error);
    res.status(500).json({ message: "Błąd generowania raportu" });
  }
});

// Raport popularności filmów
router.get("/popularity", authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.id,
        m.title,
        COUNT(DISTINCT s.id) as sessions_count,
        COUNT(t.id) as tickets_sold,
        COALESCE(SUM(CAST(t.price AS DECIMAL(10,2))), 0) as revenue,
        COALESCE(AVG(CAST(t.price AS DECIMAL(10,2))), 0) as avg_price,
        COUNT(DISTINCT t.user_id) as unique_viewers
      FROM movies m
      LEFT JOIN sessions s ON s.movie_id = m.id
      LEFT JOIN tickets t ON t.session_id = s.id
      GROUP BY m.id, m.title
      ORDER BY tickets_sold DESC
    `);
    
    res.json(rows.map(r => ({
      ...r,
      revenue: parseFloat(r.revenue) || 0,
      avg_price: parseFloat(r.avg_price) || 0
    })));
  } catch (error) {
    console.error("Popularity report error:", error);
    res.status(500).json({ message: "Błąd generowania raportu" });
  }
});

export default router;

