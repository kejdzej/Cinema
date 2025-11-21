import { pool } from '../db.js';

export async function adminRequired(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length || rows[0].role !== 'admin') {
      console.log(`🚫 UNAUTHORIZED ADMIN ACCESS: User ${req.user?.email} (${req.user?.id}) tried to access ${req.path}`);
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
  } catch (e) {
    console.error('Admin check error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}